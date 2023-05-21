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
    myMap.controls.remove('zoomControl');
    myMap.behaviors.disable('scrollZoom');
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
                preset: 'islands#blueDotIconWithCaption',
                hasBalloon: false
            });
            collectionTour.add(mark);
        }
        myMap.geoObjects.add(collectionTour);
        collectionTour.events.add('click', (e) => {
            target = e.get('target');
            selfClass = target.properties._data.balloonContent;
            window.open(selfClass);
        })
    });
}