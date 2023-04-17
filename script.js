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
console.log(moving);

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


function getMarks(selfClass) {
    const date = Date.now();
    let currentDate = null;
    let xhr = new XMLHttpRequest();
    // 2. Настраиваем его: GET-запрос по URL /article/.../load
    xhr.open('GET', `http://45.146.166.178:5000/area='${selfClass.slice(1)}'`);
    // 3. Отсылаем запрос
    xhr.send();
    showMarks = '';
    // 4. Этот код сработает после того, как мы получим ответ сервера
    xhr.onload = function () {
        if (xhr.status != 200) { // анализируем HTTP-статус ответа, если статус не 200, то произошла ошибка
            alert(`Ошибка ${xhr.status}: ${xhr.statusText}`); // Например, 404: Not Found
        } else { // если всё прошло гладко, выводим результат
            if (xhr.response == '') return;
            answer = JSON.parse(xhr.response);
            answer.cities = JSON.parse(answer.cities);
            console.log(answer);
            counter = 0;
            for (el in answer.cities) {
                showMarks += `<a id="mark" href='${el}' target="_blank" style="cursor:pointer;"><path d="M12,2C8.1,2,5,5.1,5,9c0,6,7,13,7,13s7-7.1,7-13C19,5.1,15.9,2,12,2z M12,11.5c-1.4,0-2.5-1.1-2.5-2.5s1.1-2.5,2.5-2.5s2.5,1.1,2.5,2.5S13.4,11.5,12,11.5z" transform="translate(${answer.cities[el].x},${answer.cities[el].y})"/></a><text transform="translate(${answer.cities[el].x},${answer.cities[el].y})">${el}</text>`;
            }
            do {
                currentDate = Date.now();
            } while (currentDate - date < 200);
            $marks.innerHTML = showMarks;
            listenMarks();
        }
    };
    $marks.innerHTML = showMarks;
}

function listenMarks() {
    marksList = $marks.querySelectorAll('a');
    marksList.forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            selfClass = el.getAttribute('href');
            currentElement = document.querySelector(`.map a[href="${selectedArea}"]`);
            console.log(currentElement);
            currentElement.setAttribute('transform', `scale(4, 4) translate(-520, -400)`);
            showMarks = '';
            $marks.innerHTML = showMarks
            console.log(selfClass);
        });
    });
}