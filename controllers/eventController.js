import db from '../db/connector.js';

export const getMainPage = async (req, res) => {
    try {
        // витягуємо всі події і зразу рахуємо вільні місця 
        // COALESCE тут щоб не було null якщо жодного квитка ще не купили
        const queryText = `
            SELECT e.*, 
                   (e.total_seats - COALESCE(COUNT(t.id), 0))::INT AS free_seats
            FROM events e
            LEFT JOIN tickets t ON e.id = t.event_id
            GROUP BY e.id
            ORDER BY e.date ASC;
        `;
        const result = await db.query(queryText);
        res.render('index', { events: result.rows, error: req.query.error || null });
    } catch (error) {
        console.error(error);
        res.status(500).send('Помилка при завантаженні головної сторінки');
    }
};

export const createEvent = async (req, res) => {
    const { title, date, description, total_seats, duration } = req.body;
    try {
        await db.query(
            'INSERT INTO events (title, date, description, total_seats, duration) VALUES ($1, $2, $3, $4, $5)',
            [title, date, description, total_seats, duration]
        );
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Не вдалося створити подію');
    }
};

export const getEditPage = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM events WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).send('Подію не знайдено');
        
        const event = result.rows[0];
        
        // валідація на 24 години перед тим як пустити на сторінку
        const diffInHours = (new Date(event.date) - new Date()) / (1000 * 60 * 60);
        if (diffInHours < 24) {
            return res.redirect('/?error=' + encodeURIComponent('Редагування заборонено! До заходу залишилось менше 24 годин.'));
        }

        res.render('edit', { event });
    } catch (error) {
        console.error(error);
        res.status(500).send('Помилка сервера');
    }
};

export const updateEvent = async (req, res) => {
    const { id } = req.params;
    const { title, date, description, total_seats, duration } = req.body;
    try {
        const result = await db.query('SELECT date FROM events WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).send('Подію не знайдено');

        // ще раз перевіряємо час на бекенді про всяк випадок
        const diffInHours = (new Date(result.rows[0].date) - new Date()) / (1000 * 60 * 60);
        if (diffInHours < 24) return res.status(400).send('Зміни заблоковано (менше 24 годин до заходу)');

        await db.query(
            'UPDATE events SET title=$1, date=$2, description=$3, total_seats=$4, duration=$5 WHERE id=$6',
            [title, date, description, total_seats, duration, id]
        );
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Помилка при оновленні події');
    }
};

export const deleteEvent = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT date FROM events WHERE id = $1', [id]);
        if (result.rows.length === 0) return res.status(404).send('Подію не знайдено');

        const diffInHours = (new Date(result.rows[0].date) - new Date()) / (1000 * 60 * 60);
        if (diffInHours < 24) {
            return res.redirect('/?error=' + encodeURIComponent('Видалення заборонено! До заходу залишилось менше 24 годин.'));
        }

        await db.query('DELETE FROM events WHERE id = $1', [id]);
        res.redirect('/');
    } catch (error) {
        console.error(error);
        res.status(500).send('Помилка при видаленні події');
    }
};

export const buyTicket = async (req, res) => {
    const { event_id, name, email, phone } = req.body;
    try {
        // перевіряємо залишок місць перед продажем
        const eventQuery = `
            SELECT (e.total_seats - COALESCE(COUNT(t.id), 0))::INT AS free_seats
            FROM events e
            LEFT JOIN tickets t ON e.id = t.event_id
            WHERE e.id = $1
            GROUP BY e.id;
        `;
        const eventRes = await db.query(eventQuery, [event_id]);
        
        if (eventRes.rows.length === 0) return res.status(404).send('Подію не знайдено');
        if (eventRes.rows[0].free_seats <= 0) {
            return res.redirect('/?error=' + encodeURIComponent('Вільних місць на цю подію більше немає!'));
        }

        await db.query(
            'INSERT INTO tickets (event_id, name, email, phone) VALUES ($1, $2, $3, $4)',
            [event_id, name, email, phone]
        );
        
        // console.log(`Квиток куплено: ${email}`);
        res.redirect('/');
    } catch (error) {
        // 23505 це помилка postgres якщо такий email або телефон вже є на цю подію
        if (error.code === '23505') {
            return res.redirect('/?error=' + encodeURIComponent('Квиток на цей Email або Номер телефону вже придбано для цієї події!'));
        }
        console.error(error);
        res.status(500).send('Помилка при купівлі квитка');
    }
};