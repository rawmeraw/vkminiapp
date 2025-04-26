const API_URL = 'https://permlive.ru/api/concerts';
const PLACEHOLDER_IMG = 'https://vk.com/images/camera_200.png'; // VK-style stub

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
    const price = concert.price ? `${concert.price}₽` : '';
    const tags = Array.isArray(concert.tags) && concert.tags.length ? concert.tags.join(' / ') : '';
    const smallPic = concert.small_pic || PLACEHOLDER_IMG;
    // Ссылка на событие по slug
    const link = concert.slug ? `https://permlive.ru/event/${concert.slug}` : '#';
    // Красивая дата
    let dateLabel = '';
    const dayLabel = getDayLabel(date);
    if (date && time) {
        if (dayLabel === 'Сегодня' || dayLabel === 'Завтра') {
            dateLabel = `${dayLabel} в ${time}`;
        } else {
            dateLabel = `${dayLabel} в ${time}`;
        }
    }
    return `
    <div class="concert">
        <div class="concert-pic"><img src="${smallPic}" alt="pic" onerror="this.src='${PLACEHOLDER_IMG}'"></div>
        <div class="concert-content">
            <a href="${link}" class="concert-title" target="_blank">${title}</a>
            ${tags ? `<div class="concert-tags">${tags}</div>` : ''}
            <div class="concert-meta">${dateLabel}${place ? ' — ' + place : ''}</div>
            ${price ? `<div class="concert-price">${price}</div>` : ''}
        </div>
    </div>
    `;
}

async function loadConcerts() {
    const list = document.getElementById('concert-list');
    try {
        const resp = await fetch(API_URL);
        if (!resp.ok) throw new Error('Ошибка загрузки афиши');
        const data = await resp.json();
        if (!Array.isArray(data) || !data.length) {
            list.innerHTML = '<div class="error">Нет концертов</div>';
            return;
        }
        list.innerHTML = data.map(formatConcert).join('');
    } catch (e) {
        list.innerHTML = `<div class="error">Ошибка: ${e.message}</div>`;
    }
}

window.addEventListener('DOMContentLoaded', loadConcerts);
