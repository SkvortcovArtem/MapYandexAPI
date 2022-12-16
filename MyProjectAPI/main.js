ymaps.ready(init);

function init () {
    var myMap = new ymaps.Map('map', {
            center: [55.83312296530122,37.55377402493124],
            zoom: 15,
            controls: ['routePanelControl']
        }, {
            searchControlProvider: 'yandex#search'
        }),
        objectManager = new ymaps.ObjectManager({
            clusterize: true,
            gridSize: 64,
            clusterIconLayout: "default#pieChart"
        });

        var control = myMap.controls.get('routePanelControl');
        
        control.options.set({
            autofocus: false
        });

        // Зададим состояние панели для построения машрутов.
        control.routePanel.state.set({
            type: 'masstransit',
            fromEnabled: true,
            from: [55.83199199984195, 37.55503419135966],
            toEnabled: true
        });
    
        control.routePanel.options.set({
            allowSwitch: false,
            reverseGeocoding: true,
            types: { masstransit: true, pedestrian: true, taxi: true }
        });

    myMap.geoObjects.add(objectManager);

    var listBoxItems = ['Парк', 'Музей', 'Библиотека', 'Кинотеатр', 'Спортивный объект']
            .map(function (title) {
                return new ymaps.control.ListBoxItem({
                    data: {
                        content: title
                    },
                    state: {
                        selected: true
                    }
                })
            }),
        reducer = function (filters, filter) {
            filters[filter.data.get('content')] = filter.isSelected();
            return filters;
        },

        listBoxControl = new ymaps.control.ListBox({
            data: {
                content: 'Фильтр',
                title: 'Фильтр'
            },
            items: listBoxItems,
            state: {
                expanded: true,
                filters: listBoxItems.reduce(reducer, {})
            }
        });
    myMap.controls.add(listBoxControl);

    listBoxControl.events.add(['select', 'deselect'], function (e) {
        var listBoxItem = e.get('target');
        var filters = ymaps.util.extend({}, listBoxControl.state.get('filters'));
        filters[listBoxItem.data.get('content')] = listBoxItem.isSelected();
        listBoxControl.state.set('filters', filters);
    });

    var filterMonitor = new ymaps.Monitor(listBoxControl.state);
    filterMonitor.add('filters', function (filters) {
        objectManager.setFilter(getFilterFunction(filters));
    });

    function getFilterFunction(categories) {
        return function (obj) {
            var content = obj.properties.class;
            return categories[content]
        }
    }

    $.ajax({
        url: "data.json"
    }).done(function (data) {
        objectManager.add(data);
    });

    myCollection = new ymaps.GeoObjectCollection(),
        myPoints = [
            { coords: [55.82018964139018, 37.5464383077585], text: 'Парк Тимирязевский' },
            { coords: [55.820370577017194, 37.56670513897042], text: 'Парк Дубки' },
            { coords: [55.82976793469062, 37.5612763479243], text: 'Парк Мичуринский сад' },
            { coords: [55.84090360722513, 37.60541050982169], text: 'Парк Ботанический сад' },
            { coords: [55.828741920115945, 37.609916620966715], text: 'Парк Останкино' },
            { coords: [55.8179644269843, 37.55626501033988], text: 'Музей леса имени А.Р. Варгаса де Бедемара' },
            { coords: [55.830628492492174, 37.553251003541696], text: 'Научно-художественный музей коневодства' },
            { coords: [55.83597506136699, 37.56662658583575], text: 'Государственный музей животноводства им. Е.Ф. Лискуна' },
            { coords: [55.83446947955406, 37.548879941049414], text: 'Почвенно-агрономический музей им. В.Р. Вильямса' },
            { coords: [55.83129317357705, 37.551142419938856], text: 'Музей истории МСХА' },
            { coords: [55.836401376012184, 37.55694135582903], text: 'Музей земледельческой механики им. В.П. Горячкина' },
            { coords: [55.83576865576909, 37.54950301514455], text: 'Музей истории мелиорации и гидротехники им. А.Н. Костякова' },
            { coords: [55.82672894885953, 37.54702721738397], text: 'Музей пчеловодства имени А.Г. Аветисяна' },
            { coords: [55.83318051256972, 37.55255468851816], text: 'Центральная научная библиотека имени Н.И. Железнова' },
            { coords: [55.83358062532674, 37.57197742383645], text: 'Библиотека №29' },
            { coords: [55.82527370426838, 37.57119185600546], text: 'Библиотека №39' },
            { coords: [55.828619947448196, 37.578130089574], text: 'Библиотека №51' },
            { coords: [55.834060595618254, 37.56491752796664], text: 'Спортивно-оздоровительный комплекс имени К.А. Тимирязева' },
            { coords: [55.83347372179304, 37.53664814144577], text: 'Спортивный комплекс Наука' },
            { coords: [55.833521169956846, 37.56055243740092], text: 'Спортивный объект Теннисный корт' },
            { coords: [55.833255491976594, 37.552833039856075], text: 'Кинотеатр TimFilm' },
            { coords: [55.82862182324197, 37.58040318678738], text: 'Спортивный объект Центр физической культуры и спорта Северо-Восточного административного округа города Москвы' },
            { coords: [55.825845364300136, 37.53724989190391], text: 'Спортивный объект Внедорожная велотрасса' },
            { coords: [55.82087786606005, 37.53682548592048], text: 'Спортивный объект Спортплощадка, воркаут' },
        ];

        var mySearchControl = new ymaps.control.SearchControl({
            options: {
                provider: new CustomSearchProvider(myPoints),
                noPlacemark: true,
                resultsPerPage: 5
            }});
    
        myMap.controls
            .add(mySearchControl, { float: 'right' });
    }
    
    function CustomSearchProvider(points) {
        this.points = points;
    }
    
    CustomSearchProvider.prototype.geocode = function (request, options) {
        var deferred = new ymaps.vow.defer(),
            geoObjects = new ymaps.GeoObjectCollection(),
            offset = options.skip || 0,
            limit = options.results || 20;
            
        var points = [];
        for (var i = 0, l = this.points.length; i < l; i++) {
            var point = this.points[i];
            if (point.text.toLowerCase().indexOf(request.toLowerCase()) != -1) {
                points.push(point);
            }
        }

        points = points.splice(offset, limit);
        for (var i = 0, l = points.length; i < l; i++) {
            var point = points[i],
            coords = point.coords,
            text = point.text;

            geoObjects.add(new ymaps.Placemark(coords, {
                name: text + ' name',
                description: text + ' description',
                balloonContentBody: '<p>' + text + '</p>',
                boundedBy: [coords, coords]
            }));
        }

        deferred.resolve({
            geoObjects: geoObjects,
            metaData: {
                geocoder: {
                    request: request,
                    found: geoObjects.getLength(),
                    results: limit,
                    skip: offset
                }
            }
        });
    
        return deferred.promise();

}