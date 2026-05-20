import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import eventRoutes from './routes/eventRoutes.js';

const app = express();
const PORT = 3000;

// хак для ES Modules, бо тут немає __dirname з коробки
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// підключаємо шаблонізатор
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// щоб сервер нормально читав дані з форм (інакше req.body буде undefined)
app.use(express.urlencoded({ extended: true }));

// папка для статики (щоб підтягувався style.css)
app.use(express.static(path.join(__dirname, 'public')));

// підключаємо всі наші маршрути
app.use('/', eventRoutes);

app.listen(PORT, () => {
    console.log(`\n  СИСТЕМА КВИТКІВ УСПІШНО ЗАПУЩЕНА`);
    console.log(` Локальний хост: http://localhost:${PORT}`);
});