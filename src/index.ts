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

    getList() {
        return this.listItems;
    }

    setList(listItem: any[]) {
        listItem.map((element) => {
            this.addItem(element[0], element[1])
        })
    }

    addItem(listItem: any, style: any) {
        this.listItems.push(new Item(listItem, this.listItems.length - 1, style));
        this.updateListeners();
    }

    changeItem(itemId: number[]) {
        this.listItems = this.listItems.map(r => {
            if (itemId.includes(r.id)) r.handleSelect();
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
        })

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
    id: number;
    element: any;
    selected: boolean;
    state: "available" | "picked" = "available";
    styleElements: object;

    constructor(element: any, index: number, styleElements: object = {}) {
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
            })
            tag.append(this.item.element[key]);
            this.element.append(tag);
        })
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

    listItems: Item[] = [];
    filteredList: Item[] = [];
    stringFilter: string = "";

    constructor(private type: 'available' | 'picked') {
        super('list', 'app', false, `${type}-items`);
        this.configure();
        this.contentRender();
    }

    configure() {
        this.element.addEventListener('dragover', this.dragOverHandler);
        this.element.addEventListener('dragleave', this.dragLeaveHandler);
        this.element.addEventListener('drop', this.dropHandler);

        this.element.querySelector('.filter')!.addEventListener('change', this.filterItems.bind(this));
        this.element.querySelector('.move-right')?.addEventListener('click', () => {
            itmState.changeState();
        });

        itmState.addListener((items => {
            this.listItems = items.filter(item => item.state === this.type);
            this.filteredList = items.filter(item => item.state === this.type);
            this.itemsRender();
        }))
    }

    contentRender() {
        this.element.querySelector('ul')!.id = `${this.type}-items-list`;
        this.element.querySelector('h2')!.innerText = `${this.type.toUpperCase()} ITEMS`;
    }

    private itemsRender() {
        const listEl = <HTMLUListElement>document.getElementById(`${this.type}-items-list`);
        listEl.innerHTML = '';
        const render = this.stringFilter !== "" ? this.filteredList : this.listItems;
        for (const [index, prjItem] of render.entries()) {
            new Render(this.element.querySelector('ul')!.id, prjItem);
        }
    }

    private filterItems(e: Event) {
        e.preventDefault();

        const target = e.target as HTMLInputElement;
        this.stringFilter = target.value.toString().toLowerCase();

        if (this.stringFilter !== "") {
            this.filteredList = this.listItems.filter(item => {
                for (const value of Object.entries(item.element)) {
                    if (this.filter(value[1])) return true;
                }
            })
        } else {
            this.filteredList = this.listItems;
        }
        this.itemsRender();
    }

    private filter(value: any) {
        return value.toString().toLowerCase().includes(this.stringFilter);
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

const mockedList = new List(
    "available"
)
const mockedListPicked = new List(
    "picked"
)

enum statusCard {
    Instock,
    Lowstock
}

class OptionStyle {
    htmlTag: string;
    cssProperties: object;

    constructor(htmlTag: string, cssProperties: object = {}) {
        this.htmlTag = htmlTag;
        this.cssProperties = cssProperties;
    }
}

class Card {
    constructor(public index: string, public title: string, public tag: string, public amount: string, public status: statusCard) {
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
}
const listCards: any[] = [];

listCards.push([new Card("1", "Bamboo Watch", "Accessories", "$65", statusCard.Instock), styleCard]);
listCards.push([new Card("2", "Black Watch", "Accessories", "$72", statusCard.Instock), styleCard]);
listCards.push([new Card("3", "Blue Band", "Fitness", "$79", statusCard.Lowstock), styleCard]);
listCards.push([new Card("4", "Blue T-Shirt", "Clothin", "$29", statusCard.Instock), styleCard]);

itmState.setList(listCards);