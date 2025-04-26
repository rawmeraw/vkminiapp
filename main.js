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
    const monthsGen = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
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
    // Родительный падеж месяца
    const dayOfWeek = days[date.getDay()];
    const day = date.getDate().toString().replace(/^0/, '');
    const month = monthsGen[date.getMonth()];
    return `${dayOfWeek}, ${day} ${month}`;
}

function formatConcert(concert) {
    const date = concert.date || '';
    const time = (concert.time || '').slice(0,5);
    const title = concert.title || '';
    const place = (concert.place && (concert.place.short_name || concert.place.name)) || '';
    // Фото: если нет, ставим zhivoe_logo.jpg из vkminiapp
    let smallPic = concert.small_pic || 'zhivoe_logo.jpg';
    if (!smallPic || smallPic === PLACEHOLDER_IMG) {
        smallPic = 'zhivoe_logo.jpg';
    }
    // Цена: если 0, null, undefined или '0', показываем "Бесплатно"
    let price = '';
    let priceHtml = '';
    if (concert.price === 0 || concert.price === '0' || concert.price === 0.0 || concert.price === null || concert.price === undefined) {
        price = 'Бесплатно';
        priceHtml = `<span class=\"concert-price-white\">${price}</span>`;
    } else {
        price = `${concert.price}₽`;
        if (concert.tickets && typeof concert.tickets === 'string' && concert.tickets.trim()) {
            priceHtml = `<a href=\"${concert.tickets}\" class=\"price-link\" target=\"_blank\">${price}</a>`;
        } else {
            priceHtml = `<span class=\"concert-price-white\">${price}</span>`;
        }
    }
    const tags = Array.isArray(concert.tags) && concert.tags.length ? concert.tags.map(tag => tag.name).join(' / ') : '';
    const link = concert.slug ? `https://permlive.ru/event/${concert.slug}` : '#';
    const dateLabel = date ? getDayLabel(date) + (time ? `, ${time}` : '') : '';
    const glowColor = getGlowColor(concert);
    let bgColor = glowColor.replace(/rgba?\(([^)]+)\)/, (m, c) => {
        let parts = c.split(',').map(x => x.trim());
        if (parts.length >= 3) {
            parts[3] = '0.05';
            return `rgba(${parts.join(',')})`;
        }
        return m;
    });
    let borderColor = bgColor.replace(/rgba?\(([^)]+)\)/, (m, c) => {
        let parts = c.split(',').map(x => x.trim());
        if (parts.length >= 3) {
            parts[3] = '0.13';
            return `rgba(${parts.join(',')})`;
        }
        return m;
    });
    let picGlow = glowColor.replace(/rgba?\(([^)]+)\)/, (m, c) => {
        let parts = c.split(',').map(x => x.trim());
        if (parts.length >= 3) {
            parts[3] = '0.58';
            return `rgba(${parts.join(',')})`;
        }
        return m;
    });
    // Glow сила для названия (зависит от рейтинга)
    let rating = parseFloat(concert.rating || 0);
    let glowClass = '';
    let titleStyle = '';
    if (rating >= 0.1) {
        const intensity = Math.min((rating / 2), 1); // 0.1 почти нет, 2+ макс
        const glowAlpha = (0.12 + intensity * 0.5).toFixed(2); // от 0.12 до 0.62
        titleStyle = `text-shadow: 0 0 10px rgba(255,255,255,${glowAlpha}), 0 0 24px rgba(255,255,255,${glowAlpha});`;
        glowClass = 'glow';
    }
    // Desktop: дата, место и цена/бесплатно в одну строку через стрелки
    let metaLineDesktop = `<span class=\"meta-left\">${dateLabel}${place ? ` → ${place}` : ''}${priceHtml ? ` → ${priceHtml}` : ''}</span>`;
    metaLineDesktop = metaLineDesktop.replace('→', ' → '); // добавляем пробел между стрелкой и ценой
    // Mobile: цена без стрелки и на новой строке
    let metaLineMobile = `<span class=\"meta-left\">${dateLabel}${place ? ` → ${place}` : ''}</span><span class=\"meta-price\">${priceHtml}</span>`;
    // Итоговый metaLine: только одна версия отображается через CSS
    let metaLine = `<span class=\"meta-desktop\">${metaLineDesktop}</span><span class=\"meta-mobile\">${metaLineMobile}</span>`;
    return `
    <div class=\"concert\" style=\"--concert-bg: ${bgColor}; --concert-pic-border: ${borderColor}; --concert-pic-glow: ${picGlow};\">
        <div class=\"concert-pic\"><img src=\"${smallPic}\" alt=\"pic\" onerror=\"this.src='zhivoe_logo.jpg'\"></div>
        <div class=\"concert-content\">
            <a href=\"${link}\" class=\"concert-title${glowClass ? ' ' + glowClass : ''}\" style=\"${titleStyle}\" target=\"_blank\">${title}</a>
            ${tags ? `<div class=\"concert-tags\">${tags}</div>` : ''}
            <div class=\"concert-meta\">${metaLine}</div>
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

// Получаем текущее время Екатеринбурга
function getEkaterinburgNow() {
    // local time given in metadata is already UTC+5
    return new Date();
}

// Фильтрация концертов по дате/времени (оставляем только будущие)
function filterFutureConcerts(concerts) {
    const now = getEkaterinburgNow();
    return concerts.filter(concert => {
        if (!concert.date || !concert.time) return true;
        const [year, month, day] = concert.date.split('-').map(Number);
        const [hour, minute] = (concert.time || '00:00').split(':').map(Number);
        // Дата-концерт в UTC+5
        const concertDate = new Date(year, month - 1, day, hour, minute);
        return concertDate >= now;
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
        data = filterFutureConcerts(data);
        data = sortConcerts(data);
        list.innerHTML = data.map(formatConcert).join('');
    } catch (e) {
        list.innerHTML = `<div class="error">Ошибка: ${e.message}</div>`;
    }
}

window.addEventListener('DOMContentLoaded', loadConcerts);
