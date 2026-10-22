let dishes = [];
let selectedDishes = { soup: null, main: null, salad: null, drink: null, dessert: null };

// !!! ЗАМЕНИТЕ ЭТОТ КЛЮЧ НА ВАШ РЕАЛЬНЫЙ КЛЮЧ ИЗ СДО !!!
const API_KEY = '123e4567-e89b-12d3-a456-426655440000'; 
const API_URL = 'https://edu.std-900.ist.mospolytech.ru/labs/api';

function isValidCombo(selected) {
    const hasSoup = !!selected.soup;
    const hasMain = !!selected.main;
    const hasSalad = !!selected.salad;
    const hasDrink = !!selected.drink;
    
    if (!hasDrink) return false;
    if (hasSoup && hasMain && hasSalad) return true;
    if (hasSoup && hasMain && !hasSalad) return true;
    if (hasSoup && !hasMain && hasSalad) return true;
    if (!hasSoup && hasMain && hasSalad) return true;
    if (!hasSoup && hasMain && !hasSalad) return true;
    return false;
}

function showNotification(message) {
    const existing = document.querySelector('.notification-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.className = 'notification-overlay';
    const box = document.createElement('div');
    box.className = 'notification-box';
    
    const text = document.createElement('p');
    text.textContent = message;
    
    const btn = document.createElement('button');
    btn.className = 'notification-btn';
    btn.textContent = 'Окей';
    btn.addEventListener('click', () => overlay.remove());

    box.appendChild(text);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

async function loadCheckout() {
    const savedOrder = localStorage.getItem('lunchOrder');
    if (!savedOrder) {
        document.getElementById('order-items-container').innerHTML = `
            <p style="text-align:center; font-size:18px;">Ничего не выбрано. Чтобы добавить блюда в заказ, перейдите на страницу <a href="menu.html" style="color:tomato;">Собрать ланч</a>.</p>
        `;
        document.getElementById('checkout-form-section').style.display = 'none';
        return;
    }
    
    selectedDishes = JSON.parse(savedOrder);
    
    try {
        const response = await fetch(`${API_URL}/dishes`);
        dishes = await response.json();
        renderOrderItems();
        updateFormSummary();
        document.getElementById('checkout-form-section').style.display = 'block';
    } catch (error) {
        console.error(error);
        document.getElementById('order-items-container').innerHTML = '<p style="text-align:center;">Ошибка загрузки данных</p>';
    }
}

function renderOrderItems() {
    const container = document.getElementById('order-items-container');
    container.innerHTML = '';
    
    const selectedArray = Object.values(selectedDishes).filter(id => id !== null);
    
    if (selectedArray.length === 0) {
        container.innerHTML = `<p style="text-align:center;">Ничего не выбрано. Чтобы добавить блюда в заказ, перейдите на страницу <a href="menu.html" style="color:tomato;">Собрать ланч</a>.</p>`;
        document.getElementById('checkout-form-section').style.display = 'none';
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'dishes-grid';
    
    selectedArray.forEach(id => {
        const dish = dishes.find(d => d.id === id);
        if (!dish) return;
        
        const card = document.createElement('div');
        card.className = 'dish-card';
        card.innerHTML = `
            <img src="${dish.image}" alt="${dish.name}">
            <p class="price">${dish.price} ₽</p>
            <p class="name">${dish.name}</p>
            <p class="weight">${dish.count}</p>
            <button class="btn-remove" data-id="${dish.id}">Удалить</button>
        `;
        grid.appendChild(card);
    });
    
    container.appendChild(grid);
    
    document.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', () => {
            const idToRemove = parseInt(btn.dataset.id, 10);
            for (const key in selectedDishes) {
                if (selectedDishes[key] === idToRemove) {
                    selectedDishes[key] = null;
                }
            }
            localStorage.setItem('lunchOrder', JSON.stringify(selectedDishes));
            renderOrderItems();
            updateFormSummary();
        });
    });
}

function updateFormSummary() {
    const summaryContainer = document.getElementById('form-summary-content');
    const totalPriceEl = document.getElementById('form-total-price');
    
    let total = 0;
    let html = '';
    
    const categories = [
        { key: 'soup', label: 'Суп' },
        { key: 'main', label: 'Главное блюдо' },
        { key: 'salad', label: 'Салат или стартер' },
        { key: 'drink', label: 'Напиток' },
        { key: 'dessert', label: 'Десерт' }
    ];
    
    categories.forEach(cat => {
        const id = selectedDishes[cat.key];
        if (id) {
            const dish = dishes.find(d => d.id === id);
            if (dish) {
                total += dish.price;
                html += `<div class="order-item"><span class="order-category">${cat.label}:</span> ${dish.name} — ${dish.price} ₽</div>`;
            }
        } else {
            const notSelectedText = cat.key === 'main' ? 'Не выбрано' : 'Не выбран';
            html += `<div class="order-item empty"><span class="order-category">${cat.label}:</span> ${notSelectedText}</div>`;
        }
    });
    
    summaryContainer.innerHTML = html;
    totalPriceEl.textContent = total;
}

document.addEventListener('DOMContentLoaded', () => {
    loadCheckout();

    document.getElementById('checkout-form').addEventListener('submit', async (event) => {
        event.preventDefault();
        
        if (!isValidCombo(selectedDishes)) {
            showNotification('Состав заказа не соответствует ни одному из доступных комбо. Проверьте выбранные блюда.');
            return;
        }

        const formData = new FormData(event.target);
        
        if (selectedDishes.soup) formData.append('soup_id', selectedDishes.soup);
        if (selectedDishes.main) formData.append('main_course_id', selectedDishes.main);
        if (selectedDishes.salad) formData.append('salad_id', selectedDishes.salad);
        if (selectedDishes.drink) formData.append('drink_id', selectedDishes.drink);
        if (selectedDishes.dessert) formData.append('dessert_id', selectedDishes.dessert);

        const deliveryPref = formData.get('delivery_time_pref');
        formData.set('delivery_type', deliveryPref);
        
        if (deliveryPref === 'by_time') {
            const exactTime = formData.get('exact_time');
            if (!exactTime) {
                showNotification('Укажите точное время доставки.');
                return;
            }
            formData.set('delivery_time', exactTime);
        }
        formData.delete('exact_time');
        formData.delete('delivery_time_pref');

        formData.set('subscribe', formData.get('newsletter') ? 1 : 0);
        formData.delete('newsletter');

        formData.set('full_name', formData.get('name'));
        formData.delete('name');
        
        formData.set('delivery_address', formData.get('address'));
        formData.delete('address');

        try {
            const response = await fetch(`${API_URL}/orders?api_key=${API_KEY}`, {
                method: 'POST',
                body: formData
            });
            
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.error || 'Ошибка сервера');
            }
            
            showNotification('Заказ успешно оформлен!');
            localStorage.removeItem('lunchOrder');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
            
        } catch (error) {
            showNotification('Ошибка при отправке заказа: ' + error.message);
        }
    });
});