// --- КОНФИГУРАЦИЯ ---
// URL вашего API-эндпоинта для приема данных
const API_ENDPOINT = 'http://127.0.0.1:5000/api/v1/track'; 
const USER_ID_KEY = 'my_site_user_id'; // Ключ для Local Storage
// --- КОНФИГУРАЦИЯ ---

/**
 * Получает или создает уникальный ID пользователя и определяет статус визита.
 * @returns {{userId: string, isNewUser: boolean}} Объект с ID и статусом.
 */
function getUserIdAndStatus() {
    let userId = localStorage.getItem(USER_ID_KEY);
    let isNewUser = false;
    
    if (!userId) {
        // ID НЕ НАЙДЕН -> ЭТО НОВЫЙ ПОЛЬЗОВАТЕЛЬ
        userId = 'user-' + Date.now() + Math.random().toString(16).slice(2);
        localStorage.setItem(USER_ID_KEY, userId);
        isNewUser = true;
        console.log('✅ НОВЫЙ ПОЛЬЗОВАТЕЛЬ. ID сохранен:', userId);
    } else {
        // ID НАЙДЕН -> ЭТО ВОЗВРАЩАЮЩИЙСЯ ПОЛЬЗОВАТЕЛЬ
        isNewUser = false;
        console.log('🔄 ВОЗВРАЩАЮЩИЙСЯ. Текущий ID:', userId);
    }
    
    return { userId, isNewUser };
}

/**
 * Формирует данные и имитирует их отправку на сервер.
 * @param {string} eventType - тип события (page_view, custom_event и т.д.)
 * @param {object} customData - дополнительные данные
 */
function trackEvent(eventType, customData = {}) {
    // Получаем ID и статус в одном вызове
    const { userId, isNewUser } = getUserIdAndStatus();
    
    const data = {
        user_id: userId,
        event_type: eventType,
        
        // КЛЮЧЕВАЯ ИНФОРМАЦИЯ ДЛЯ СТАТИСТИКИ
        is_new_user: isNewUser, // true/false
        
        // Стандартные мета-данные
        page_url: window.location.href,
        referrer: document.referrer || 'direct',
        timestamp: new Date().toISOString(),
        
        ...customData
    };

    // --- ИМИТАЦИЯ ОТПРАВКИ НА СЕРВЕР ---
    console.groupCollapsed(`🚀 Имитация отправки: ${eventType}`);
    console.log('Статус визита:', isNewUser ? 'НОВЫЙ' : 'ВОЗВРАЩЕНИЕ');
    console.log('URL API:', API_ENDPOINT);
    console.log('Отправляемый JSON:', JSON.stringify(data, null, 2));
    console.groupEnd();
}

// ------------------------------------------------------------------
// АВТОМАТИЧЕСКОЕ ОТСЛЕЖИВАНИЕ СТАТИСТИКИ ВИЗИТА
// ------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Отслеживаем "визит" (сессию) при загрузке страницы
    trackEvent('session_start', { page_title: document.title });
});
