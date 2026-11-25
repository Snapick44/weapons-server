const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

const SECRET_KEY = 'super_secret_key_123';

// --- РЕГИСТРАЦИЯ ---
app.post('/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Введите логин и пароль' });
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const existing = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Пользователь уже существует' });
    
    await db.execute({ sql: 'INSERT INTO users (username, password) VALUES (?, ?)', args: [username, hashedPassword] });
    res.json({ message: 'Регистрация успешна!' });
  } catch (err) { res.status(500).json({ error: 'Ошибка сервера' }); }
});

// --- ВХОД ---
app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await db.execute({ sql: 'SELECT * FROM users WHERE username = ?', args: [username] });
    const user = result.rows[0];
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Неверный логин или пароль' });
    }
    
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: '24h' });
    res.json({ token });
  } catch (err) { res.status(500).json({ error: 'Ошибка сервера' }); }
});

// --- ПРОВЕРКА ТОКЕНА ---
function checkAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Нет доступа' });
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ error: 'Неверный токен' });
    req.user = user;
    next();
  });
}

// --- ПОЛУЧИТЬ ВСЁ ОРУЖИЕ ---
app.get('/weapons', async (req, res) => {
  try {
    const result = await db.execute('SELECT * FROM weapons');
    const weapons = result.rows.map(w => ({
      ...w, 
      specs: JSON.parse(w.specs || '[]'), 
      facts: JSON.parse(w.facts || '[]'), 
      photos: JSON.parse(w.photos || '[]')
    }));
    res.json(weapons);
  } catch (err) { res.status(500).json({ error: 'Ошибка БД' }); }
});

// --- ДОБАВИТЬ НОВОЕ ОРУЖИЕ ---
app.post('/weapons', checkAuth, async (req, res) => {
  try {
    const { id, name, country, year, creator, specs, history, facts } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'ID и Название обязательны' });
    
    await db.execute({
      sql: 'INSERT INTO weapons (id, name, country, year, creator, specs, history, facts, photos) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      args: [id, name, country || '', year || '', creator || '', JSON.stringify(specs || []), history || '', JSON.stringify(facts || []), '[]']
    });
    res.json({ message: 'Оружие успешно добавлено!' });
  } catch (err) { res.status(500).json({ error: 'Ошибка (возможно, такой ID уже есть)' }); }
});

// --- УДАЛИТЬ ОРУЖИЕ ---
app.delete('/weapons/:id', checkAuth, async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM weapons WHERE id = ?', args: [req.params.id] });
    res.json({ message: 'Оружие удалено' });
  } catch (err) { res.status(500).json({ error: 'Ошибка удаления' }); }
});

// --- ОБНОВИТЬ ОРУЖИЕ (Редактирование) ---
app.put('/weapons/:id', checkAuth, async (req, res) => {
  try {
    const { name, country, year, creator, specs, history, facts } = req.body;
    await db.execute({
      sql: 'UPDATE weapons SET name=?, country=?, year=?, creator=?, specs=?, history=?, facts=? WHERE id=?',
      args: [name, country || '', year || '', creator || '', JSON.stringify(specs || []), history || '', JSON.stringify(facts || []), req.params.id]
    });
    res.json({ message: 'Оружие обновлено' });
  } catch (err) { res.status(500).json({ error: 'Ошибка обновления' }); }
});

// --- СОХРАНИТЬ ССЫЛКУ НА ФОТО В БАЗУ ---
app.post('/weapons/:id/photos', checkAuth, async (req, res) => {
  try {
    const { photoUrl } = req.body;
    const result = await db.execute({ sql: 'SELECT photos FROM weapons WHERE id = ?', args: [req.params.id] });
    if (result.rows.length === 0) return res.status(404).json({ error: 'Оружие не найдено' });
    
    let photos = JSON.parse(result.rows[0].photos || '[]');
    photos.push(photoUrl);
    
    await db.execute({ sql: 'UPDATE weapons SET photos = ? WHERE id = ?', args: [JSON.stringify(photos), req.params.id] });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Ошибка сохранения' }); }
});

// --- ЗАГРУЗКА ФАЙЛА ФОТО НА СЕРВЕР ---
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storage });

app.post('/upload', checkAuth, upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Файл не загружен' });
  
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({ url: fileUrl });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
