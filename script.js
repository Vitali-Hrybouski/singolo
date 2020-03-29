var multiItemSlider = (function () {

    function _isElementVisible(element) {
        var rect = element.getBoundingClientRect(),
            vWidth = window.innerWidth || doc.documentElement.clientWidth,
            vHeight = window.innerHeight || doc.documentElement.clientHeight,
            elemFromPoint = function (x, y) { return document.elementFromPoint(x, y) };
        if (rect.right < 0 || rect.bottom < 0
            || rect.left > vWidth || rect.top > vHeight)
            return false;
        return (
            element.contains(elemFromPoint(rect.left, rect.top))
            || element.contains(elemFromPoint(rect.right, rect.top))
            || element.contains(elemFromPoint(rect.right, rect.bottom))
            || element.contains(elemFromPoint(rect.left, rect.bottom))
        );
    }

    return function (selector, config) {
        var
            _mainElement = document.querySelector(selector), // основный элемент блока
            _sliderContainer = _mainElement.querySelector('.slider__container'), // обертка для .slider__item
            _sliderItems = _mainElement.querySelectorAll('.slider__item'), // элементы (.slider__item)
            _sliderControls = _mainElement.querySelectorAll('.slider__control'), // элементы управления
            _sliderControlLeft = _mainElement.querySelector('.left__arrow'), // кнопка "LEFT"
            _sliderControlRight = _mainElement.querySelector('.right__arrow'), // кнопка "RIGHT"
            _containerWidth = parseFloat(getComputedStyle(_sliderContainer).width), // ширина обёртки
            _itemWidth = parseFloat(getComputedStyle(_sliderItems[0]).width), // ширина одного элемента    
            _positionLeftItem = 0, // позиция левого активного элемента
            _transform = 0, // значение транфсофрмации .slider__container
            _step = _itemWidth / _containerWidth * 100, // величина шага (для трансформации)
            _items = [], // массив элементов
            _interval = 0,
            _html = _mainElement.innerHTML,
            _states = [
                { active: false, minWidth: 0, count: 1 },
                { active: false, minWidth: 1100, count: 2 }
            ],
            _config = {
                isCycling: false, // автоматическая смена слайдов
                direction: 'right', // направление смены слайдов
                interval: 5000, // интервал между автоматической сменой слайдов
                pause: true // устанавливать ли паузу при поднесении курсора к слайдеру
            };

        for (var key in config) {
            if (key in _config) {
                _config[key] = config[key];
            }
        }

        // наполнение массива _items
        _sliderItems.forEach(function (item, index) {
            _items.push({ item: item, position: index, transform: 0 });
        });

        var _setActive = function () {
            var _index = 0;
            var width = parseFloat(document.body.clientWidth);
            _states.forEach(function (item, index, arr) {
                _states[index].active = false;
                if (width >= _states[index].minWidth)
                    _index = index;
            });
            _states[_index].active = true;
        }

        var _getActive = function () {
            var _index;
            _states.forEach(function (item, index, arr) {
                if (_states[index].active) {
                    _index = index;
                }
            });
            return _index;
        }

        var position = {
            getItemMin: function () {
                var indexItem = 0;
                _items.forEach(function (item, index) {
                    if (item.position < _items[indexItem].position) {
                        indexItem = index;
                    }
                });
                return indexItem;
            },
            getItemMax: function () {
                var indexItem = 0;
                _items.forEach(function (item, index) {
                    if (item.position > _items[indexItem].position) {
                        indexItem = index;
                    }
                });
                return indexItem;
            },
            getMin: function () {
                return _items[position.getItemMin()].position;
            },
            getMax: function () {
                return _items[position.getItemMax()].position;
            }
        }

        var _transformItem = function (direction) {
            var nextItem;
            if (!_isElementVisible(_mainElement)) {
                return;
            }
            if (direction === 'right') {
                _positionLeftItem++;
                if ((_positionLeftItem + _containerWidth / _itemWidth - 1) > position.getMax()) {
                    nextItem = position.getItemMin();
                    _items[nextItem].position = position.getMax() + 1;
                    _items[nextItem].transform += _items.length * 100;
                    _items[nextItem].item.style.transform = 'translateX(' + _items[nextItem].transform + '%)';
                }
                _transform -= _step;
            }
            if (direction === 'left') {
                _positionLeftItem--;
                if (_positionLeftItem < position.getMin()) {
                    nextItem = position.getItemMax();
                    _items[nextItem].position = position.getMin() - 1;
                    _items[nextItem].transform -= _items.length * 100;
                    _items[nextItem].item.style.transform = 'translateX(' + _items[nextItem].transform + '%)';
                }
                _transform += _step;
            }
            _sliderContainer.style.transform = 'translateX(' + _transform + '%)';
        }

        var _cycle = function (direction) {
            if (!_config.isCycling) {
                return;
            }
            _interval = setInterval(function () {
                _transformItem(direction);
            }, _config.interval);
        }

        // обработчик события click для кнопок "назад" и "вперед"
        var _controlClick = function (e) {
            if (e.target.classList.contains('slider__control')) {
                e.preventDefault();
                var direction = e.target.classList.contains('right__arrow') ? 'right' : 'left';
                _transformItem(direction);
                clearInterval(_interval);
                _cycle(_config.direction);
            }
        };

        // обработка события изменения видимости страницы
        var _handleVisibilityChange = function () {
            if (document.visibilityState === "hidden") {
                clearInterval(_interval);
            } else {
                clearInterval(_interval);
                _cycle(_config.direction);
            }
        }

        var _refresh = function () {
            clearInterval(_interval);
            _mainElement.innerHTML = _html;
            _sliderContainer = _mainElement.querySelector('.slider__container');
            _sliderItems = _mainElement.querySelectorAll('.slider__item');
            _sliderControls = _mainElement.querySelectorAll('.slider__control');
            _sliderControlLeft = _mainElement.querySelector('.left__arrow');
            _sliderControlRight = _mainElement.querySelector('.right__arrow');
            _containerWidth = parseFloat(getComputedStyle(_sliderContainer).width);
            _itemWidth = parseFloat(getComputedStyle(_sliderItems[0]).width);
            _positionLeftItem = 0;
            _transform = 0;
            _step = _itemWidth / _containerWidth * 100;
            _items = [];
            _sliderItems.forEach(function (item, index) {
                _items.push({ item: item, position: index, transform: 0 });
            });
        }

        var _setUpListeners = function () {
            _mainElement.addEventListener('click', _controlClick);
            if (_config.pause && _config.isCycling) {
                _mainElement.addEventListener('mouseenter', function () {
                    clearInterval(_interval);
                });
                _mainElement.addEventListener('mouseleave', function () {
                    clearInterval(_interval);
                    _cycle(_config.direction);
                });
            }
            document.addEventListener('visibilitychange', _handleVisibilityChange, false);
            window.addEventListener('resize', function () {
                var
                    _index = 0,
                    width = parseFloat(document.body.clientWidth);
                _states.forEach(function (item, index, arr) {
                    if (width >= _states[index].minWidth)
                        _index = index;
                });
                if (_index !== _getActive()) {
                    _setActive();
                    _refresh();
                }
            });
        }

        // инициализация
        _setUpListeners();
        if (document.visibilityState === "visible") {
            _cycle(_config.direction);
        }
        _setActive();

        return {
            right: function () { // метод right
                _transformItem('right');
            },
            left: function () { // метод left
                _transformItem('left');
            },
            stop: function () { // метод stop
                _config.isCycling = false;
                clearInterval(_interval);
            },
            cycle: function () { // метод cycle 
                _config.isCycling = true;
                clearInterval(_interval);
                _cycle();
            }
        }

    }
}());

var slider = multiItemSlider('.slider', {
    isCycling: false
})


let iphoneHorizontal = document.querySelector(".black__bg_horizontal");
let iphoneButtonHorizontal = document.querySelector(".button__home_horizontal");
let iphoneVertical = document.querySelector(".black__bg_vertical");
let iphoneButtonVertical = document.querySelector(".button__home_vertical");
let phoneVertical = document.querySelector(".black__bg_phone-vertical");
let phoneButton = document.querySelector(".button__phone-vertical");

iphoneButtonHorizontal.onclick = changeBg;
iphoneHorizontal.onclick = changeBg;
function changeBg() {
    if (iphoneHorizontal.style.backgroundColor === "transparent") iphoneHorizontal.style.backgroundColor = "black";
    else iphoneHorizontal.style.backgroundColor = "transparent";
}

iphoneButtonVertical.onclick = changeBg2;
iphoneVertical.onclick = changeBg2;
function changeBg2() {
    if (iphoneVertical.style.backgroundColor === "transparent") iphoneVertical.style.backgroundColor = "black";
    else iphoneVertical.style.backgroundColor = "transparent";
}

phoneButton.onclick = changeBg3;
phoneVertical.onclick = changeBg3;
function changeBg3() {
    if (phoneVertical.style.backgroundColor === "transparent") phoneVertical.style.backgroundColor = "black";
    else phoneVertical.style.backgroundColor = "transparent";
}

// функция фиксации цвета элементов навигации хэдера
let menuLi = document.querySelectorAll(".menu__nav");
let burgerMenuLi = document.querySelectorAll(".menu__burger-nav");

let topHeader = document.getElementById("home").getBoundingClientRect().top;
let topServices = document.getElementById("services").getBoundingClientRect().top;
let topPortfolio = document.getElementById("portfolio").getBoundingClientRect().top;
let topAbout = document.getElementById("about__us").getBoundingClientRect().top;
let topContact = document.getElementById("contact").getBoundingClientRect().top;

let bottomHeader = document.getElementById("home").getBoundingClientRect().bottom;
let bottomServices = document.getElementById("services").getBoundingClientRect().bottom;
let bottomPortfolio = document.getElementById("portfolio").getBoundingClientRect().bottom;
let bottomAbout = document.getElementById("about__us").getBoundingClientRect().bottom;
let bottomContact = document.getElementById("contact").getBoundingClientRect().bottom;


for (let i = 0; i < menuLi.length; i++) {
    menuLi[i].onclick = selectionMenuNav;
}
for (let i = 0; i < burgerMenuLi.length; i++) {
    burgerMenuLi[i].onclick = selectionMenuNav;
}

function selectionMenuNav() {
    for (let i = 0; i < menuLi.length; i++) {
        menuLi[i].style.color = "white";
    }
    this.style.color = "rgb(240, 108, 100)";
}
function resetColorNav() {
    for (let i = 0; i < menuLi.length; i++) {
        menuLi[i].style.color = "white";
        burgerMenuLi[i].style.color = "white";
    }
}

window.addEventListener('scroll', function () {
    let y = Math.round(window.scrollY)
    if (y < bottomHeader) {
        resetColorNav();
        menuLi[0].style.color = "rgb(240, 108, 100)";
        burgerMenuLi[0].style.color = "rgb(240, 108, 100)";
    }
    if (y >= topServices && y < bottomServices) {
        resetColorNav();
        menuLi[1].style.color = "rgb(240, 108, 100)";
        burgerMenuLi[1].style.color = "rgb(240, 108, 100)";
    }
    if (y >= topPortfolio && y < bottomPortfolio) {
        resetColorNav();
        menuLi[2].style.color = "rgb(240, 108, 100)";
        burgerMenuLi[2].style.color = "rgb(240, 108, 100)";
    }
    if (y >= topAbout && y < bottomAbout) {
        resetColorNav();
        menuLi[3].style.color = "rgb(240, 108, 100)";
        burgerMenuLi[3].style.color = "rgb(240, 108, 100)";
    }
    if (y >= topContact && y < bottomContact) {
        resetColorNav();
        menuLi[4].style.color = "rgb(240, 108, 100)";
        burgerMenuLi[4].style.color = "rgb(240, 108, 100)";
    }
});

// функция фиксации белого контура вокруг таба при нажатии и рандомное смещение картинок
let li = document.querySelectorAll(".portfolio__botton-tab");
let portfolioImagesArr = [];
let img = document.querySelectorAll(".img");
img.forEach(e => portfolioImagesArr.push(e.src));

for (let i = 0; i < li.length; i++) {
    li[i].onclick = selectionButton;
}
function selectionButton() {
    for (let i = 0; i < li.length; i++) {
        li[i].style.color = "rgb(118, 126, 158)";
        li[i].style.borderColor = "rgb(118, 126, 158)";
    }
    this.style.color = "white";
    this.style.borderColor = "white";
    for (let i = 0; i < img.length; i++) {
        img[i].classList.remove("img__active");
    }
    replaceImages();
}

// функция перетасовки картинок
function replaceImages() {
    portfolioImagesArr.sort(() => Math.random() - 0.5);
    for (let i = 0; i < portfolioImagesArr.length; i++) {
        img[i].src = portfolioImagesArr[i];
    }
}

// функция отображения рамки вокруг картинки при ее нажатии

for (let i = 0; i < img.length; i++) {
    img[i].onclick = addBorderImg;
}
function addBorderImg() {
    for (let i = 0; i < img.length; i++) {
        img[i].classList.remove("img__active");
    }
    this.classList.add("img__active");
}


// функция модального окна для формы
let submit = document.querySelector(".submit");
let popup = document.querySelector(".popup");
let theme = document.getElementById("popup__theme");
let description = document.getElementById("popup__description");
let popupButton = document.querySelector(".popup__button");

submit.addEventListener("click", evt => {
    evt.preventDefault();
    if (document.forms["form"].email.checkValidity() && document.forms["form"].name.checkValidity()) {
        event.preventDefault();

        if (document.forms["form"].subject.value !== "")
            theme.textContent = `Тема: ${document.forms["form"].subject.value}`
        else theme.textContent = 'Без темы'

        if (document.forms["form"].detail.value !== "")
            description.textContent = `Описание: ${document.forms["form"].detail.value}`
        else description.textContent = 'Без описания'

        popup.style.display = "block";

    }
});

popupButton.onclick = closeSend;
function closeSend() {
    document.forms["form"].name.value = "";
    document.forms["form"].email.value = "";
    document.forms["form"].subject.value = "";
    document.forms["form"].detail.value = "";
    popup.style.display = "none";
}

// активация бургер меню
let menu = document.querySelector('.menu__btn__bloq');
let cross = document.querySelector('.menu__btn__cross');
let burgerList = document.querySelectorAll('.menu__burger-nav');
menu.onclick = open;
for (let i = 0; i < burgerList.length; i++) {
    burgerList[i].onclick = close;
}
cross.onclick = close;

function open() {
    document.querySelector('.burger__layer').style.display = "block";
    menu.style.display = 'none';
    cross.style.display = 'block';
}

function close() {
    document.querySelector('.burger__layer').style.display = "none";
    menu.style.display = 'block';
    cross.style.display = 'none';
}


