let dishes = [];
let selectedDishes = { soup: null, main: null, salad: null, drink: null, dessert: null };
const activeFilters = { soup: null, main: null, salad: null, drink: null, dessert: null };

// Загрузка из localStorage при старте
const savedOrder = localStorage.getItem('lunchOrder');
if (savedOrder) {
    selectedDishes = JSON.parse(savedOrder);
}

function saveOrder() {
    localStorage.setItem('lunchOrder', JSON.stringify(selectedDishes));
    updateStickyPanel();
}

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

function updateStickyPanel() {
    const panel = document.getElementById('sticky-panel');
    const totalPriceEl = document.getElementById('panel-total-price');
    const checkoutLink = document.getElementById('checkout-link');
    
    let total = 0;
    let count = 0;
    
    for (const key in selectedDishes) {
        if (selectedDishes[key]) {
            const dish = dishes.find(d => d.id === selectedDishes[key]);
            if (dish) {
                total += dish.price;
                count++;
            }
        }
    }
    
    if (count === 0) {
        panel.style.display = 'none';
    } else {
        panel.style.display = 'block';
        totalPriceEl.textContent = total;
        if (isValidCombo(selectedDishes)) {
            checkoutLink.classList.add('active');
            checkoutLink.classList.remove('disabled');
        } else {
            checkoutLink.classList.remove('active');
            checkoutLink.classList.add('disabled');
        }
    }
}

async function loadDishes() {
    try {
        const response = await fetch('https://edu.std-900.ist.mospolytech.ru/labs/api/dishes');
        if (!response.ok) throw new Error('Ошибка загрузки данных');
        dishes = await response.json();
        dishes.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
        renderDishes();
        updateStickyPanel();
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        document.getElementById('soups-container').innerHTML = '<p style="text-align:center;padding:40px;">Ошибка загрузки данных</p>';
    }
}

function renderDishes() {
    ['soups', 'main-dishes', 'salads', 'drinks', 'desserts'].forEach(cat => {
        document.getElementById(`${cat}-container`).innerHTML = '';
    });

    dishes.forEach(dish => {
        if (activeFilters[dish.category] && activeFilters[dish.category] !== dish.kind) return;

        const card = document.createElement('div');
        card.className = 'dish-card';
        if (selectedDishes[dish.category] === dish.id) {
            card.classList.add('selected');
        }
        card.dataset.dish = dish.id; 
        
        card.innerHTML = `
            <img src="${dish.image}" alt="${dish.name}">
            <p class="price">${dish.price} ₽</p>
            <p class="name">${dish.name}</p>
            <p class="weight">${dish.count}</p>
            <button class="btn-add" data-category="${dish.category}" data-id="${dish.id}" data-name="${dish.name}" data-price="${dish.price}">Добавить</button>
        `;
        
        let container;
        if (dish.category === 'soup') container = document.getElementById('soups-container');
        else if (dish.category === 'main') container = document.getElementById('main-dishes-container');
        else if (dish.category === 'salad') container = document.getElementById('salads-container');
        else if (dish.category === 'drink') container = document.getElementById('drinks-container');
        else if (dish.category === 'dessert') container = document.getElementById('desserts-container');
        
        if (container) container.appendChild(card);
    });

    document.querySelectorAll('.btn-add').forEach(button => {
        button.addEventListener('click', () => {
            const category = button.dataset.category;
            const id = parseInt(button.dataset.id, 10);
            
            selectedDishes[category] = id;
            saveOrder();

            document.querySelectorAll('.dish-card').forEach(c