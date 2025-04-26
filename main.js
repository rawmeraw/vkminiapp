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
    return days[date.getDay()];
}

function formatConcert(concert) {
    const date = concert.date || '';
    const time = (concert.time || '').slice(0,5);
    const title = concert.title || '';
    const place = (concert.place && (concert.place.short_name || concert.place.name)) || '';
    const price = concert.price ? `${concert.price}₽` : '';
    const tags = Array.isArray(concert.tags) && concert.tags.length ? concert.tags.join(' / ') : '';
    const smallPic = concert.small_pic || PLACEHOLDER_IMG;
    // Ссылка на событие
    const link = concert.id ? `https://permlive.ru/concerts/${concert.id}` : '#';
    // Красивая дата
    let dateLabel = '';
    if (date && time) {
        dateLabel = `${getDayLabel(date)}, ${date.split('-').reverse().join('.')} в ${time}`;
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
