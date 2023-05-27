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
        center: [65, 100],
        zoom: 2,
    }, {
        //searchControlProvider: 'yandex#search',
        restrictMapArea: [[10, 10], [85, -160]]
    });
    // Добавим заливку цветом.
    var pane = new ymaps.pane.StaticPane(myMap, {
        zIndex: 100, css: {
            width: '100%', height: '100%', backgroundColor: '#f7f7f7'
        }
    });
    // Добавляет слой заливку
    myMap.panes.append('white', pane);
    // Убираем полоску зума
    myMap.controls.remove('zoomControl');
    // Отключаем зум на колесико
    myMap.behaviors.disable('scrollZoom');
    // Зададим цвета федеральных округов.
    var districtColors = {
        cfo: '#ffff6f',
        szfo: '#54cbba',
        yfo: '#f9768e',
        skfo: '#9a5597',
        pfo: '#30cb05',
        urfo: '#bac1cc',
        sfo: '#16acdb',
        dfo: '#fbc520'
    };
    // Зададим подсказки при наведении на федеральный округ.
    var districtsHints = {
        cfo: 'ЦФО',
        szfo: 'СЗФО',
        yfo: 'ЮФО',
        skfo: 'СКФО',
        pfo: 'ПФО',
        urfo: 'УрФО',
        sfo: 'СФО',
        dfo: 'ДФО'
    };
    // Создадим балун.
    var districtBalloon = new ymaps.Balloon(myMap);
    districtBalloon.options.setParent(myMap.options);
    // Загрузим регионы.
    ymaps.borders.load('RU', {
        lang: 'ru',
        quality: 2
    }).then(function (result) {
        // Создадим объект, в котором будут храниться коллекции с нашими регионами.
        var districtCollections = {};
        // Для каждого федерального округа создадим коллекцию.
        for (var district in districtColors) {
            districtCollections[district] = new ymaps.GeoObjectCollection(null, {
                fillColor: districtColors[district],
                strokeColor: districtColors[district],
                strokeOpacity: 0.3,
                fillOpacity: 0.3,
                hintCloseTimeout: 0,
                hintOpenTimeout: 0
            });
            // Создадим свойство в коллекции, которое позже наполним названиями субъектов РФ.
            districtCollections[district].properties.districts = [];
            districtCollections[district].properties.title = districtTitle[district].title;
            districtCollections[district].properties.description = districtTitle[district].description;
        }
        result.features.forEach(function (feature) {
            var iso = feature.properties.iso3166;
            var name = feature.properties.name;
            var district = districtByIso[iso];
            // Для каждого субъекта РФ зададим подсказку с названием федерального округа, которому он принадлежит.
            feature.properties.hintContent = districtsHints[district];
            // Добавим субъект РФ в соответствующую коллекцию.
            districtCollections[district].add(new ymaps.GeoObject(feature));
            // Добавим имя субъекта РФ в массив.
            districtCollections[district].properties.districts.push(name);
        });
        // Создадим переменную, в которую будем сохранять выделенный в данный момент федеральный округ.
        var highlightedDistrict;
        for (var districtName in districtCollections) {
            // Добавим коллекцию на карту.
            myMap.geoObjects.add(districtCollections[districtName]);
            // При наведении курсора мыши будем выделять федеральный округ.
            districtCollections[districtName].events.add('mouseenter', function (event) {
                var district = event.get('target').getParent();
                district.options.set({ fillOpacity: 1 });
            });
            // При выводе курсора за пределы объекта вернем опции по умолчанию.
            districtCollections[districtName].events.add('mouseleave', function (event) {
                var district = event.get('target').getParent();
                if (district !== highlightedDistrict) {
                    district.options.set({ fillOpacity: 0.3 });
                }
            });
            // Подпишемся на событие клика.
            districtCollections[districtName].events.add('click', function (event) {
                var target = event.get('target');
                var district = target.getParent();
                // Если на карте выделен федеральный округ, то мы снимаем с него выделение.
                if (highlightedDistrict) {
                    highlightedDistrict.options.set({ fillOpacity: 0.3 })
                }
                // Откроем балун в точке клика. В балуне будут перечислены регионы того федерального округа,
                // по которому кликнул пользователь.
                districtBalloon.open(event.get('coords'), `<b>${district.properties.title}</b><br>${district.properties.description}`);
                console.log(district);
                console.log(districtBalloon);
                // Выделим федеральный округ.
                district.options.set({ fillOpacity: 1 });
                // Сохраним ссылку на выделенный федеральный округ.
                highlightedDistrict = district;
            });
        };
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
        // Убирает слой заливку
        myMap.panes.remove(pane);
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