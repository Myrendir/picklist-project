"use strict";
class Component {
    constructor(templateId, renderElemId, insertAtStart, newElemId) {
        this.templateElem = document.getElementById(templateId);
        this.renderElem = document.getElementById(renderElemId);
        const importedNode = document.importNode(this.templateElem.content, true);
        this.element = importedNode.firstElementChild;
        if (newElemId)
            this.element.id = newElemId;
        this.attach(insertAtStart);
    }
    attach(insert) {
        this.renderElem.insertAdjacentElement(insert ? "afterbegin" : "beforeend", this.element);
    }
}
class ListenerState {
    constructor() {
        this.listeners = [];
    }
    addListener(listenerFn) {
        this.listeners.push(listenerFn);
    }
}
class State extends ListenerState {
    constructor() {
        super();
        this.listItems = [];
        this.listItems = [];
    }
    static getInstance() {
        if (this.instance)
            return this.instance;
        this.instance = new State();
        return this.instance;
    }
    getList() {
        return this.listItems;
    }
    setList(listItem) {
        listItem.map((element) => {
            this.addItem(element[0], element[1]);
        });
    }
    addItem(listItem, style) {
        this.listItems.push(new Item(listItem, this.listItems.length - 1, style));
        this.updateListeners();
    }
    changeItem(itemId) {
        this.listItems = this.listItems.map(r => {
            if (itemId.includes(r.id))
                r.handleSelect();
            return r;
        });
        this.updateListeners();
    }
    changeState() {
        this.listItems = this.listItems.map(item => {
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
    }
    updateListeners() {
        for (const listenerFn of this.listeners) {
            listenerFn(this.listItems.slice());
        }
    }
}
const itmState = State.getInstance();
class Item {
    constructor(element, index, styleElements = {}) {
        this.state = "available";
        this.id = new Date().getTime();
        this.id += index;
        this.element = element;
        this.selected = false;
        this.styleElements = styleElements;
    }
    handleSelect() {
        this.selected = !this.selected;
    }
}
class Render extends Component {
    constructor(hostId, item) {
        super('item', hostId, false);
        this.dragEndHandler = (_) => {
            console.log('DragEnd');
        };
        this.item = item;
        this.configure();
        this.contentRender();
    }
    configure() {
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler);
        this.element.addEventListener('click', () => {
            itmState.changeItem([this.item.id]);
        });
    }
    contentRender() {
        if (this.item.selected) {
            this.element.classList.add("selected");
        }
        Object.entries(this.item.styleElements).forEach(([key, value]) => {
            let tag = document.createElement(value.htmlTag);
            tag.classList.add(key.toString());
            Object.entries(value.cssProperties).forEach(([key, value]) => {
                tag.style[key] = value;
            });
            tag.append(this.item.element[key]);
            this.element.append(tag);
        });
    }
    dragStartHandler(event) {
        event.dataTransfer.setData('text/plain', this.item.id.toString());
        event.dataTransfer.effectAllowed = 'move';
    }
}
class List extends Component {
    constructor(type) {
        super('list', 'app', false, `${type}-items`);
        this.type = type;
        this.listItems = [];
        this.filteredList = [];
        this.stringFilter = "";
        this.dragLeaveHandler = (_) => {
            const listEl = this.element.querySelector('ul');
            listEl.classList.remove('droppable');
        };
        this.dragOverHandler = (event) => {
            if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
                event.preventDefault();
                const listEl = this.element.querySelector('ul');
                listEl.classList.add('droppable');
            }
        };
        this.configure();
        this.contentRender();
    }
    configure() {
        var _a;
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);
        this.element.querySelector('.filter').addEventListener('change', this.filterItems.bind(this));
        (_a = this.element.querySelector('.move-right')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            itmState.changeState();
        });
        itmState.addListener((items => {
            this.listItems = items.filter(item => item.state === this.type);
            this.filteredList = items.filter(item => item.state === this.type);
            this.itemsRender();
        }));
    }
    contentRender() {
        this.element.querySelector('ul').id = `${this.type}-items-list`;
        this.element.querySelector('h2').innerText = `${this.type.toUpperCase()} ITEMS`;
    }
    itemsRender() {
        const listEl = document.getElementById(`${this.type}-items-list`);
        listEl.innerHTML = '';
        const render = this.stringFilter !== "" ? this.filteredList : this.listItems;
        for (const [index, prjItem] of render.entries()) {
            new Render(this.element.querySelector('ul').id, prjItem);
        }
    }
    filterItems(e) {
        e.preventDefault();
        const target = e.target;
        this.stringFilter = target.value.toString().toLowerCase();
        if (this.stringFilter !== "") {
            this.filteredList = this.listItems.filter(item => {
                for (const value of Object.entries(item.element)) {
                    if (this.filter(value[1]))
                        return true;
                }
            });
        }
        else {
            this.filteredList = this.listItems;
        }
        this.itemsRender();
    }
    filter(value) {
        return value.toString().toLowerCase().includes(this.stringFilter);
    }
    dropHandler(event) {
    }
}
const mockedList = new List("available");
const mockedListPicked = new List("picked");
var statusCard;
(function (statusCard) {
    statusCard[statusCard["Instock"] = 0] = "Instock";
    statusCard[statusCard["Lowstock"] = 1] = "Lowstock";
})(statusCard || (statusCard = {}));
class OptionStyle {
    constructor(htmlTag, cssProperties = {}) {
        this.htmlTag = htmlTag;
        this.cssProperties = cssProperties;
    }
}
class Card {
    constructor(index, title, tag, amount, status) {
        this.index = index;
        this.title = title;
        this.tag = tag;
        this.amount = amount;
        this.status = status;
    }
}
const styleCard = {
    title: new OptionStyle("h2", {
        fontWeight: "bolder"
    }),
    tag: new OptionStyle("p"),
    amount: new OptionStyle("p"),
    status: new OptionStyle("p", {
        color: statusCard.Instock ? 'green' : 'yellow'
    })
};
const listCards = [];
listCards.push([new Card("1", "Bamboo Watch", "Accessories", "$65", statusCard.Instock), styleCard]);
listCards.push([new Card("2", "Black Watch", "Accessories", "$72", statusCard.Instock), styleCard]);
listCards.push([new Card("3", "Blue Band", "Fitness", "$79", statusCard.Lowstock), styleCard]);
listCards.push([new Card("4", "Blue T-Shirt", "Clothin", "$29", statusCard.Instock), styleCard]);
itmState.setList(listCards);
