const API_URL = 'https://permlive.ru/api/concerts';
const PLACEHOLDER_IMG = 'https://vk.com/images/camera_200.png'; // VK-style stub

// Категории для glow
const CATEGORY_COLORS = {
    'Live': 'rgba(211,47,47,0.7)', // красный
    'Pop': 'rgba(33,150,243,0.7)', // синий
    'Classic': 'rgba(56,182,56,0.7)', // зеленый
};

function getTagCategory(concert) {
    // Попробуем взять категорию из первого тега, если есть поле category
    if (Array.isArray(concert.tags) && concert.tags.length && concert.tag_categories && concert.tag_categories.length) {
        return concert.tag_categories[0];
    }
    // Fallback: если есть поле category
    if (concert.category) return concert.category;
    return null;
}

function getGlowColor(concert) {
    const category = getTagCategory(concert);
    if (category && CATEGORY_COLORS[category]) {
        return CATEGORY_COLORS[category];
    }
    return 'rgba(255,255,255,0.2)'; // дефолтный светлый glow
}

function getDayLabel(dateStr) {
    const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const now = new Date();
    const date = new Date(dateStr);
    const isToday = now.toDateString() === date.toDateString();
    if (isToday) {
        return 'Сегодня';
    }
    // Если завтра
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    if (tomorrow.toDateString() === date.toDateString()) {
        return 'Завтра';
    }
    // Возвращаем день недели и дату (без ведущего ноля в числе, месяц словами)
    const dayOfWeek = days[date.getDay()];
    const day = date.getDate().toString().replace(/^0/, ''); // убрать ведущий ноль
    const month = date.toLocaleString('ru-RU', { month: 'long' });
    return `${dayOfWeek}, ${day} ${month}`;
}

function formatConcert(concert) {
    const date = concert.date || '';
    const time = (concert.time || '').slice(0,5);
    const title = concert.title || '';
    const place = (concert.place && (concert.place.short_name || concert.place.name)) || '';
    // Цена
    let price = concert.price !== null && concert.price !== undefined ? `${concert.price}₽` : '';
    // Исправлено: выводим имена тегов
    const tags = Array.isArray(concert.tags) && concert.tags.length ? concert.tags.map(tag => tag.name).join(' / ') : '';
    const smallPic = concert.small_pic || PLACEHOLDER_IMG;
    // Ссылка на событие по slug
    const link = concert.slug ? `https://permlive.ru/event/${concert.slug}` : '#';
    const dateLabel = date ? getDayLabel(date) + (time ? `, ${time}` : '') : '';
    const glowColor = getGlowColor(concert);
    // Цена: если есть tickets — не показываем отдельно цену, если нет — цена белая
    let priceHtml = '';
    if (!concert.tickets && price) {
        priceHtml = `<div class="concert-price concert-price-white">${price}</div>`;
    }
    // Кнопка Купить билет: если есть tickets, кнопка красная, ширина по тексту + паддинг
    let ticketBtn = '';
    if (concert.tickets && typeof concert.tickets === 'string' && concert.tickets.trim()) {
        const btnText = price ? `Купить билет${price !== '0₽' ? ` от ${price}` : ''}` : 'Купить билет';
        ticketBtn = `<a href="${concert.tickets}" class="concert-ticket-btn" target="_blank">${btnText}</a>`;
    }
    return `
    <div class="concert">
        <div class="concert-pic" style="box-shadow: 0 0 0 4px ${glowColor}, 0 0 12px 2px ${glowColor};"><img src="${smallPic}" alt="pic" onerror="this.src='${PLACEHOLDER_IMG}'"></div>
        <div class="concert-content">
            <a href="${link}" class="concert-title" target="_blank">${title}</a>
            ${tags ? `<div class="concert-tags">${tags}</div>` : ''}
            <div class="concert-meta">${dateLabel}${place ? ' — ' + place : ''}</div>
            ${priceHtml}
            ${ticketBtn}
        </div>
    </div>
    `;
}

function parseTime(date, time) {
    if (!date || !time) return 0;
    const [h, m] = time.split(':');
    return new Date(date + 'T' + h.padStart(2, '0') + ':' + m.padStart(2, '0')).getTime();
}

function sortConcerts(data) {
    return data.slice().sort((a, b) => {
        // Сортировка по дате (возрастание)
        if (a.date < b.date) return -1;
        if (a.date > b.date) return 1;
        // В пределах одной даты: по рейтингу (по убыванию)
        const ar = parseFloat(a.rating || 0);
        const br = parseFloat(b.rating || 0);
        if (ar > br) return -1;
        if (ar < br) return 1;
        // Если рейтинг одинаковый — по времени (по возрастанию)
        const at = parseTime(a.date, a.time);
        const bt = parseTime(b.date, b.time);
        return at - bt;
    });
}

async function loadConcerts() {
    const list = document.getElementById('concert-list');
    try {
        const resp = await fetch(API_URL);
        if (!resp.ok) throw new Error('Ошибка загрузки афиши');
        let data = await resp.json();
        if (!Array.isArray(data) || !data.length) {
            list.innerHTML = '<div class="error">Нет концертов</div>';
            return;
        }
        data = sortConcerts(data);
        list.innerHTML = data.map(formatConcert).join('');
    } catch (e) {
        list.innerHTML = `<div class="error">Ошибка: ${e.message}</div>`;
    }
}

window.addEventListener('DOMContentLoaded', loadConcerts);
