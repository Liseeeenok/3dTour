const $leftLinks = document.querySelectorAll('.left-menu a');
const $mapLinks = document.querySelectorAll('.map a');
const $info = document.querySelector('.info');
const $marks = document.getElementById('marks');
const $back_map = document.getElementById('back_map');

const requestData = (id = 1) => {
    fetch('data.json')
        .then((response) => {
            return response.json();
        })
        .then((data) => {
            $info.innerHTML = `
			<h2>${data[id - 1].district}</h2>
			<p>${data[id - 1].info}</p>
		`;
        });
};

moving = [];

fetch('data.json')
    .then((response) => {
        return response.json();
    })
    .then((data) => {
        data.forEach(el => {
            moving.push({ x: el.x, y: el.y });
        });
    });

requestData();
selectedArea = '';

$leftLinks.forEach(el => {
    el.addEventListener('mouseenter', (e) => {
        if (el.getAttribute('href') != selectedArea) {
            let self = e.currentTarget;
            let color = '#333';
            let currentPolygon = self.querySelectorAll('polygon');
            let currentPath = self.querySelectorAll('path');
            if (currentPolygon) currentPolygon.forEach(el => el.style.cssText = `fill: ${color}; stroke-width: 2px;`);
            if (currentPath) currentPath.forEach(el => el.style.cssText = `fill: ${color}; stroke-width: 2px;`);
            self.classList.add('active');
        }
    });
    el.addEventListener('mouseleave', (e) => {
        if (el.getAttribute('href') != selectedArea) {
            let self = e.currentTarget;
            let currentPolygon = self.querySelectorAll('polygon');
            let currentPath = self.querySelectorAll('path');
            if (currentPolygon) currentPolygon.forEach(el => el.style.cssText = ``);
            if (currentPath) currentPath.forEach(el => el.style.cssText = ``);
            self.classList.remove('active');
        }
    });

    el.addEventListener('click', (e) => {
        if (selectedArea != '') {
            currentElement = document.querySelector(`.left-menu a[href="${selectedArea}"]`);
            currentElement.classList.remove('active');
        }
        e.preventDefault();
        let self = e.currentTarget;
        let selfClass = self.getAttribute('href');
        selectedArea = selfClass;
        currentElement = document.querySelector(`.map a[href="${selfClass}"]`);
        currentPolygon = currentElement.querySelectorAll('polygon');
        currentPath = currentElement.querySelectorAll('path');
        if (currentPolygon) currentPolygon.forEach(el => el.style.cssText = `opacity: 1;`);
        if (currentPath) currentPath.forEach(el => el.style.cssText = `opacity: 1;`);
        let id = parseInt(self.dataset.id);
        requestData(id);
        clear();
        currentElement.setAttribute('transform', `scale(1.2, 1.2) translate(${moving[id - 1].x}, ${moving[id - 1].y})`);
        self.classList.add('active');
        getMarks(selfClass);
    });
});

function clear() {
    $mapLinks.forEach(el => {
        if (el.getAttribute('href') != selectedArea && el.id != 'mark') {
            let currentPolygon = el.querySelectorAll('polygon');
            let currentPath = el.querySelectorAll('path');
            if (currentPolygon) currentPolygon.forEach(el => el.style.cssText = `opacity: 0.1;`);
            if (currentPath) currentPath.forEach(el => el.style.cssText = `opacity: 0.1;`);
            el.setAttribute('transform', '');
        }
    });
}

$mapLinks.forEach(el => {
    el.addEventListener('mouseenter', (e) => {
        if (selectedArea == '') {
            el.setAttribute('transform', 'scale(1.005, 1.005)');
            let self = e.currentTarget;
            let selfClass = self.getAttribute('href');
            let color = self.dataset.color;
            let currentElement = document.querySelector(`.left-menu a[href="${selfClass}"]`);
            let currentPolygon = self.querySelectorAll('polygon');
            let currentPath = self.querySelectorAll('path');
            if (currentPolygon) currentPolygon.forEach(el => el.style.cssText = `fill: ${color}; stroke-width: 2px; position:absolute;`);
            if (currentPath) currentPath.forEach(el => el.style.cssText = `fill: ${color}; stroke-width: 2px; position:absolute;`);
            currentElement.classList.add('active');
        }
    });

    el.addEventListener('mouseleave', (e) => {
        if (selectedArea == '') {
            el.setAttribute('transform', '');
            let self = e.currentTarget;
            let selfClass = self.getAttribute('href');
            let currentElement = document.querySelector(`.left-menu a[href="${selfClass}"]`);
            let currentPolygon = self.querySelectorAll('polygon');
            let currentPath = self.querySelectorAll('path');
            if (currentPolygon) currentPolygon.forEach(el => el.style.cssText = ``);
            if (currentPath) currentPath.forEach(el => el.style.cssText = ``);
            currentElement.classList.remove('active');
        }
    });

    el.addEventListener('click', (e) => {
        if (selectedArea == '') {
            e.preventDefault();
            let self = e.currentTarget;
            let selfClass = self.getAttribute('href');
            selectedArea = selfClass;
            let currentElement = document.querySelector(`.left-menu a[href="${selfClass}"]`);
            let id = parseInt(currentElement.dataset.id);
            requestData(id);
            clear();
            el.setAttribute('transform', `scale(1.2, 1.2) translate(${moving[id - 1].x}, ${moving[id - 1].y})`);
            getMarks(selfClass);
        }
    });
});

back_map.addEventListener('click', (e) => {
    if (selectedArea != '') {
        currentElement = document.querySelector(`.left-menu a[href="${selectedArea}"]`);
        currentElement.classList.remove('active');
    };
    selectedArea = '';
    showMarks = '';
    $marks.innerHTML = showMarks;
    $mapLinks.forEach(el => {
        if (el.id != 'mark') {
            let currentPolygon = el.querySelectorAll('polygon');
            let currentPath = el.querySelectorAll('path');
            if (currentPolygon) currentPolygon.forEach(el => el.style.cssText = `opacity: 1;`);
            if (currentPath) currentPath.forEach(el => el.style.cssText = `opacity: 1;`);
            el.setAttribute('transform', '');
        }
    });
});


async function getMarksCities(selfClass) {
    response = await fetch(`http://45.146.166.178:5000/city='${selfClass}'`);
    if (response.ok) {
        answer = await response.json();
        answer.coordinates = JSON.parse(answer.coordinates);
        return answer;
    }
    else {
        console.log("Ошибка HTTP: " + response.status);
    }
}

var myMap;

// Дождёмся загрузки API и готовности DOM.
ymaps.ready(init);

function init() {
    // Создание экземпляра карты и его привязка к контейнеру с
    // заданным id ("map").
    myMap = new ymaps.Map('map', {
        // При инициализации карты обязательно нужно указать
        // её центр и коэффициент масштабирования.
        center: [55.15463775, 82.88576487],
        zoom: 4
    }, {
        searchControlProvider: 'yandex#search'
    });
    var collection = new ymaps.GeoObjectCollection();
    var collectionTour = new ymaps.GeoObjectCollection();
    var mark = new ymaps.Placemark([52.27136719, 104.26052455], {
        iconCaption: 'Иркутск'
    }, {
        preset: 'islands#blueDotIconWithCaption'
    });
    collection.add(mark);
    myMap.geoObjects.add(collection);
    collection.events.add('click', async (e) => {
        // Получим ссылку на геообъект, по которому кликнул пользователь.
        var target = e.get('target');
        // Получение название этого объекта
        selfClass = target.properties._data.iconCaption;
        // Делаем зум к метке
        myMap.setZoom(myMap.getZoom() + 8);
        // Переместим центр карты по координатам метки с учётом заданных отступов.
        myMap.panTo(target.geometry.getCoordinates(), { useMapMargin: true });
        // Удаление всех точек   
        myMap.geoObjects.removeAll();
        // Запрос к БД по этому городу
        answer = await getMarksCities(selfClass);
        console.log(answer);
        for (el in answer.coordinates) {
            mark = new ymaps.Placemark([answer.coordinates[el].x, answer.coordinates[el].y], {
                balloonContent: answer.coordinates[el].src,
                iconCaption: el
            }, {
                preset: 'islands#blueDotIconWithCaption'
            });
            collectionTour.add(mark);
        }
        myMap.geoObjects.add(collectionTour);
    });
}