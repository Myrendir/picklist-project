# PickList typescript for Need For School 

### Prerequisites

1. Npm
2. TypeScript

## Installation

#### Git clone

```bash
https://github.com/Myrendir/picklist-project.git
```

#### Build
```bash
tsc -build tsconfig.json -> to generate your js file
```

## Add this code at the end of your index.ts

```js
const mock = {
  id: 1,
  title: "toto",
  description: "michel",
  value: 5,
  type: "text",
};

const mockedList = new List("available");
const mockedListSelected = new List("picked");

class ItemTest {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: 0
  ) {}
}

const listData: ItemTest[] = [];

for (let i = 0; i < 20; i++) {
  let test = new ItemTest(i.toString(), "Title", "Description", i + 20, 0);
  listData.push(test);
}

prjState.setList(listData);
```

# You can start your localhost server now and enjoy


## Authors

* [Armand Deshais](https://github.com/Myrendir)
* [Dorian Legros](https://github.com/DorianLegros)
* [Ahmed Bouknana](https://github.com/AhmedBouk)
