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
        this.renderElem.insertAdjacentElement(insert ? 'afterbegin' : 'beforeend', this.element);
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
        this.listItems = listItem.map((item, index) => new Item(item, index));
        this.updateListeners();
    }
    addItem(listItem) {
        this.listItems.push(new Item(listItem, this.listItems.length - 1));
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
const prjState = State.getInstance();
class ItemStyle {
    constructor(styleClass, value) {
        this.styleClass = styleClass;
        this.value = value;
    }
}
class Item {
    constructor(element, index) {
        this.state = "available";
        this.id = new Date().getTime();
        this.id += index;
        this.element = element;
        this.selected = false;
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
        this.element.addEventListener('click', () => { prjState.changeItem([this.item.id]); console.log(this.item); });
    }
    contentRender() {
        this.element.querySelector('h2').innerText = this.item.element.title;
        this.element.querySelector('p').innerText = this.item.element.description;
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
        (_a = this.element.querySelector('.move-right')) === null || _a === void 0 ? void 0 : _a.addEventListener('click', () => {
            prjState.changeState();
        });
        prjState.addListener((items => {
            this.listItems = items.filter(item => item.state === this.type);
            console.log(this.listItems);
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
        for (const prjItem of this.listItems) {
            new Render(this.element.querySelector('ul').id, prjItem);
        }
    }
    dropHandler(event) {
    }
}
const mock = {
    id: 1,
    title: "toto",
    description: "michel",
    value: 5,
    type: 'text'
};
const mockedList = new List("available");
const mockedListSelected = new List("picked");
class ItemTest {
    constructor(id, title, description, people, status) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.people = people;
        this.status = status;
    }
}
const listData = [];
for (let i = 0; i < 10; i++) {
    let test = new ItemTest(i.toString(), Math.random().toString() + ' test', 'test', i + 20, 0);
    listData.push(test);
    // prjState.addItem(test);
}
prjState.setList(listData);
