type Listener<T> = (items: T[]) => void;


interface Draggable {
    dragStartHandler(event: DragEvent): void;

    dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
    dragOverHandler(event: DragEvent): void;

    dropHandler(event: DragEvent): void;

    dragLeaveHandler(event: DragEvent): void;
}

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
    templateElem: HTMLTemplateElement;
    renderElem: T;
    element: U;

    constructor(templateId: string, renderElemId: string, insertAtStart: boolean, newElemId?: string) {
        this.templateElem = document.getElementById(templateId)! as HTMLTemplateElement;
        this.renderElem = document.getElementById(renderElemId)! as T;
        const importedNode = document.importNode(this.templateElem.content, true);
        this.element = importedNode.firstElementChild as U;
        if (newElemId) this.element.id = newElemId;
        this.attach(insertAtStart);
    }

    private attach(insert: boolean) {
        this.renderElem.insertAdjacentElement(insert ? 'afterbegin' : 'beforeend', this.element);
    }

    abstract configure(): void;

    abstract contentRender(): void;
}

class ListenerState<T> {
    protected listeners: Listener<T>[] = [];

    addListener(listenerFn: Listener<T>) {
        this.listeners.push(listenerFn);
    }
}


class State extends ListenerState<Item> {
    private listItems: Item[] = [];
    private static instance: State;

    constructor() {
        super();
        this.listItems = [];
    }

    static getInstance() {
        if (this.instance)
            return this.instance;
        this.instance = new State();
        return this.instance;
    }

    setList(listItem: any[]) {
        this.listItems = listItem.map((item, index) => new Item(item, index));
        this.updateListeners();
    }

    addItem(listItem: any) {
        this.listItems.push(new Item(listItem, this.listItems.length - 1));
        this.updateListeners();
    }

    changeItem(itemId: number[]) {
        this.listItems = this.listItems.map(r => {
            if (itemId.includes(r.id)) r.handleSelect();
            return r;
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
    styleClass: string;
    value: string;

    constructor(styleClass: string, value: string) {
        this.styleClass = styleClass;
        this.value = value;
    }
}


class Item {
    id: number;
    element: any;
    selected: boolean;

    constructor(element: any, index: number) {
        this.id = new Date().getTime();
        this.id += index;
        this.element = element;
        this.selected = false;
    }

    handleSelect() {
        this.selected = !this.selected;
    }
}

class Render extends Component<HTMLUListElement, HTMLLIElement> implements Draggable {
    private item: Item;

    constructor(hostId: string, item: Item) {
        super('item', hostId, false)
        this.item = item;

        this.configure();
        this.contentRender();
    }

    configure() {
        this.element.addEventListener('dragstart', this.dragStartHandler);
        this.element.addEventListener('dragend', this.dragEndHandler);
    }

    contentRender() {
        this.element.querySelector('h2')!.innerText = this.item.element.title;
        this.element.querySelector('p')!.innerText = this.item.element.description;
    }

    dragEndHandler = (_: DragEvent) => {
        console.log('DragEnd');
    }

    dragStartHandler(event: DragEvent) {
        event.dataTransfer!.setData('text/plain', this.item.id.toString());
        event.dataTransfer!.effectAllowed = 'move';
    }

}

class List extends Component<HTMLDivElement, HTMLElement> implements DragTarget {

    assignedItems: Item[];

    constructor(private type: 'available' | 'selected') {
        super('list', 'app', false, `${type}-items`);
        this.assignedItems = [];
        this.configure();
        this.contentRender();
    }

    configure() {
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);

        prjState.addListener((items => {
            this.assignedItems = items.filter(item => this.type === 'available' ? !item.selected : item.selected);
            this.itemsRender();
        }))
    }

    contentRender() {
        this.element.querySelector('ul')!.id = `${this.type}-items-list`;
        this.element.querySelector('h2')!.innerText = `${this.type.toUpperCase()} ITEMS`;
    }

    private itemsRender() {
        if (this.type === 'available') {
            const listEl = <HTMLUListElement>document.getElementById(`${this.type}-items-list`);
            listEl.innerHTML = '';
            for (const prjItem of this.assignedItems) {
                new Render(this.element.querySelector('ul')!.id, prjItem);
            }
        }


    }

    dragLeaveHandler = (_: DragEvent) => {
        const listEl = this.element.querySelector('ul')!;
        listEl.classList.remove('droppable');
    }

    dragOverHandler = (event: DragEvent) => {
        if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
            event.preventDefault();
            const listEl = this.element.querySelector('ul')!;
            listEl.classList.add('droppable');
        }
    }

    dropHandler(event: DragEvent) {
    }
}

const mock = {
    id: 1,
    title: "toto",
    description: "michel",
    value: 5,
    type: 'text'
}

const mockedList = new List(
    "available"
)
const mockedListSelected = new List(
    "selected"
)

class ItemTest {
    constructor(public id: string, public title: string, public description: string, public people: number, public status: 0) { }
}

const listData: ItemTest[] = [];

for (let i = 0; i < 10; i++) {
    let test = new ItemTest(i.toString(), Math.random().toString()+' test', 'test', i+20, 0);
    listData.push(test);
    // prjState.addItem(test);
}

prjState.setList(listData);
