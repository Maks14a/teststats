// --- КОНФИГУРАЦИЯ ---
// ⚠️ АДРЕС ВАШЕГО РАБОЧЕГО API (FastAPI запущен на 8000)
const API_ENDPOINT = 'http://127.0.0.1:8000/api/v1/track'; 
const USER_ID_KEY = 'my_site_user_id'; // Ключ для Local Storage (Уникальный пользователь)
// ✅ НОВЫЕ КОНСТАНТЫ ДЛЯ УПРАВЛЕНИЯ СЕССИЕЙ
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 минут в миллисекундах (стандарт)
const SESSION_START_KEY = 'my_site_session_start_time'; // Ключ для Local Storage (Время последней активности)

// 📢 НОВЫЙ ПЕРЕКЛЮЧАТЕЛЬ ЛОГИРОВАНИЯ
const ENABLE_LOGGING = true; // Установите 'false', чтобы полностью отключить логи в F12

// Функция-обертка для консоли
function log(...args) {
    if (ENABLE_LOGGING) {
        console.log(...args);
    }
}
function logGroupCollapsed(label) {
    if (ENABLE_LOGGING) {
        console.groupCollapsed(label);
    }
}
function logGroupEnd() {
    if (ENABLE_LOGGING) {
        console.groupEnd();
    }
}
// --- КОНЕЦ КОНФИГУРАЦИИ ---

/**
 * Получает или создает уникальный ID пользователя и определяет статус визита.
 * @returns {{userId: string, isNewUser: boolean}} Объект с ID и статусом.
 */
function getUserIdAndStatus() {
    let userId = localStorage.getItem(USER_ID_KEY);
    let isNewUser = false;
    
    if (!userId) {
        // ID НЕ НАЙДЕН -> ЭТО НОВЫЙ ПОЛЬЗОВАТЕЛЬ
        userId = 'user-' + Date.now() + Math.random().toString(16).slice(2, 18);
        localStorage.setItem(USER_ID_KEY, userId);
        isNewUser = true;
        log('✅ НОВЫЙ ПОЛЬЗОВАТЕЛЬ. ID сохранен:', userId); // ИСПОЛЬЗУЕМ log()
    } else {
        // ID НАЙДЕН -> ЭТО ВОЗВРАЩАЮЩИЙСЯ ПОЛЬЗОВАТЕЛЬ
        isNewUser = false;
        log('🔄 ВОЗВРАЩАЮЩИЙСЯ. Текущий ID:', userId); // ИСПОЛЬЗУЕМ log()
    }
    
    return { userId, isNewUser };
}

/**
 * Проверяет, нужно ли начинать новую сессию.
 * @returns {boolean}
 */
function isNewSessionNeeded() {
    const lastSessionTime = parseInt(localStorage.getItem(SESSION_START_KEY), 10);
    const currentTime = Date.now();

    if (isNaN(lastSessionTime) || (currentTime - lastSessionTime > SESSION_TIMEOUT)) {
        log('⏱️ Требуется новая сессия. Прошло 30+ минут или это первая активность.'); // ИСПОЛЬЗУЕМ log()
        localStorage.setItem(SESSION_START_KEY, currentTime.toString());
        return true;
    }
    
    localStorage.setItem(SESSION_START_KEY, currentTime.toString());
    log('⏳ Текущая сессия продолжается. Время активности обновлено.'); // ИСПОЛЬЗУЕМ log()
    return false;
}

/**
 * Формирует данные и ОТПРАВЛЯЕТ их на сервер.
 * @param {string} eventType - тип события (session_start, page_view и т.д.)
 * @param {object} customData - дополнительные данные
 */
function trackEvent(eventType, customData = {}) {
    const { userId, isNewUser } = getUserIdAndStatus();
    
    const data = {
        user_id: userId,
        event_type: eventType,
        is_new_user: eventType === 'session_start' ? isNewUser : undefined, 
        page_url: window.location.href,
        referrer: document.referrer || 'direct',
        timestamp: new Date().toISOString(),
        ...customData
    };
    
    if (data.event_type !== 'session_start') {
        delete data.is_new_user;
    }

    const payload = JSON.stringify(data);

    try {
        const blob = new Blob([payload], { type: 'application/json' });
        const success = navigator.sendBeacon(API_ENDPOINT, blob);
        
        // ИСПОЛЬЗУЕМ logGroupCollapsed/log/logGroupEnd
        logGroupCollapsed(`🚀 Отправка данных на API (${success ? 'Успешно' : 'Ошибка'})`);
        log('URL:', API_ENDPOINT);
        log('Тип события:', eventType);
        log('Отправлен JSON:', payload);
        log('sendBeacon результат:', success);
        logGroupEnd();
        
    } catch (e) {
        console.error('❌ Ошибка при попытке отправить данные sendBeacon:', e);
    }
}

// ------------------------------------------------------------------
// АВТОМАТИЧЕСКОЕ ОТСЛЕЖИВАНИЕ СТАТИСТИКИ ВИЗИТА
// ------------------------------------------------------------------

// Функция для продления сессии (обновляет время в localStorage)
function prolongSession() {
    localStorage.setItem(SESSION_START_KEY, Date.now().toString());
}


document.addEventListener('DOMContentLoaded', () => {
    
    if (isNewSessionNeeded()) {
        trackEvent('session_start', { page_title: document.title });
    } else {
        trackEvent('page_view', { page_title: document.title });
    }
    
    // Устанавливаем обработчики для продления сессии
    document.addEventListener('click', prolongSession);
    document.addEventListener('scroll', prolongSession);
    document.addEventListener('mousemove', prolongSession);
});

// Отправка данных при уходе со страницы/закрытии вкладки
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
        trackEvent('page_view', { action: 'page_hidden', page_title: document.title });
        prolongSession();
    }
});