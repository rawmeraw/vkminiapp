const API_URL = 'https://permlive.ru/api/concerts';

function formatConcert(concert) {
    const date = concert.date || '';
    const time = (concert.time || '').slice(0,5);
    const title = concert.title || '';
    const place = (concert.place && (concert.place.short_name || concert.place.name)) || '';
    const price = concert.price ? `${concert.price}₽` : '';
    return `
        <div class="concert">
            <div class="concert-title">${title}</div>
            <div class="concert-meta">${date} ${time} @ ${place}</div>
            ${price ? `<div class="concert-price">${price}</div>` : ''}
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
