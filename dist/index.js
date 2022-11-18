"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var Component = /** @class */ (function () {
    function Component(templateId, renderElemId, insertAtStart, newElemId) {
        this.templateElem = document.getElementById(templateId);
        this.renderElem = document.getElementById(renderElemId);
        var importedNode = document.importNode(this.templateElem.content, true);
        this.element = importedNode.firstElementChild;
        if (newElemId)
            this.element.id = newElemId;
        this.attach(insertAtStart);
    }
    Component.prototype.attach = function (insert) {
        this.renderElem.insertAdjacentElement(insert ? 'afterbegin' : 'beforeend', this.element);
    };
    return Component;
}());
var ListenerState = /** @class */ (function () {
    function ListenerState() {
        this.listeners = [];
    }
    ListenerState.prototype.addListener = function (listenerFn) {
        this.listeners.push(listenerFn);
    };
    return ListenerState;
}());
var State = /** @class */ (function (_super) {
    __extends(State, _super);
    function State() {
        var _this = _super.call(this) || this;
        _this.listItems = [];
        _this.listItems = [];
        return _this;
    }
    State.getInstance = function () {
        if (this.instance)
            return this.instance;
        this.instance = new State();
        return this.instance;
    };
    State.prototype.getList = function () {
        return this.listItems;
    };
    State.prototype.setList = function (listItem) {
        this.listItems = listItem.map(function (item, index) { return new Item(item, index); });
        this.updateListeners();
    };
    State.prototype.addItem = function (listItem) {
        this.listItems.push(new Item(listItem, this.listItems.length - 1));
        this.updateListeners();
    };
    State.prototype.changeItem = function (itemId) {
        this.listItems = this.listItems.map(function (r) {
            if (itemId.includes(r.id))
                r.handleSelect();
            return r;
        });
        this.updateListeners();
    };
    State.prototype.changeState = function () {
        this.listItems = this.listItems.map(function (item) {
            if (item.selected) {
                if (item.state === "available")
                    item.state = "picked";
                else
                    item.state = "available";
                item.selected = false;
            }
            return item;
        });
        this.updateListeners();
    };
    State.prototype.updateListeners = function () {
        for (var _i = 0, _a = this.listeners; _i < _a.length; _i++) {
            var listenerFn = _a[_i];
            listenerFn(this.listItems.slice());
        }
    };
    return State;
}(ListenerState));
var prjState = State.getInstance();
var ItemStyle = /** @class */ (function () {
    function ItemStyle(styleClass, value) {
        this.styleClass = styleClass;
        this.value = value;
    }
    return ItemStyle;
}());
var Item = /** @class */ (function () {
    function Item(element, index) {
        this.state = "available";
        this.id = new Date().getTime();
        this.id += index;
        this.element = element;
        this.selected = false;
    }
    Item.prototype.handleSelect = function () {
        this.selected = !this.selected;
    };
    return Item;
}());
var Render = /** @class */ (function (_super) {
    __extends(Render, _super);
    function Render(hostId, item) {
        var _this = _super.call(this, 'item', hostId, false) || this;
        _this.dragEndHandler = function (_) {
            console.log('DragEnd');
        };
        _this.item = item;
        _this.configure();
        _this.contentRender();
        return _this;
    }
    Render.prototype.configure = function () {
        var _this = this;
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler);
        this.element.addEventListener('click', function () { prjState.changeItem([_this.item.id]); console.log(_this.item); });
    };
    Render.prototype.contentRender = function () {
        this.element.querySelector('h2').innerText = this.item.element.title;
        this.element.querySelector('p').innerText = this.item.element.description;
    };
    Render.prototype.dragStartHandler = function (event) {
        event.dataTransfer.setData('text/plain', this.item.id.toString());
        event.dataTransfer.effectAllowed = 'move';
    };
    return Render;
}(Component));
var List = /** @class */ (function (_super) {
    __extends(List, _super);
    function List(type) {
        var _this = _super.call(this, 'list', 'app', false, "".concat(type, "-items")) || this;
        _this.type = type;
        _this.listItems = [];
        _this.dragLeaveHandler = function (_) {
            var listEl = _this.element.querySelector('ul');
            listEl.classList.remove('droppable');
        };
        _this.dragOverHandler = function (event) {
            if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
                event.preventDefault();
                var listEl = _this.element.querySelector('ul');
                listEl.classList.add('droppable');
            }
        };
        _this.configure();
        _this.contentRender();
        return _this;
    }
    List.prototype.configure = function () {
        var _this = this;
        var _a;
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);
        (_a = this.element.querySelector('.move-right')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', function () {
            prjState.changeState();
        });
        prjState.addListener((function (items) {
            _this.listItems = items.filter(function (item) { return item.state === _this.type; });
            console.log(_this.listItems);
            _this.itemsRender();
        }));
    };
    List.prototype.contentRender = function () {
        this.element.querySelector('ul').id = "".concat(this.type, "-items-list");
        this.element.querySelector('h2').innerText = "".concat(this.type.toUpperCase(), " ITEMS");
    };
    List.prototype.itemsRender = function () {
        var listEl = document.getElementById("".concat(this.type, "-items-list"));
        listEl.innerHTML = '';
        for (var _i = 0, _a = this.listItems; _i < _a.length; _i++) {
            var prjItem = _a[_i];
            new Render(this.element.querySelector('ul').id, prjItem);
        }
    };
    List.prototype.dropHandler = function (event) {
    };
    return List;
}(Component));
var mock = {
    id: 1,
    title: "toto",
    description: "michel",
    value: 5,
    type: 'text'
};
var mockedList = new List("available");
var mockedListSelected = new List("picked");
var ItemTest = /** @class */ (function () {
    function ItemTest(id, title, description, people, status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.people = people;
        this.status = status;
    }
    return ItemTest;
}());
var listData = [];
for (var i = 0; i < 10; i++) {
    var test = new ItemTest(i.toString(), Math.random().toString() + ' test', 'test', i + 20, 0);
    listData.push(test);
    // prjState.addItem(test);
}
prjState.setList(listData);
