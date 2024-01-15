function createTextNode(text) {
    return {
        type: "TEXT_ELEMENT",
        props: {
            nodeValue: text,
            children: [],
        },
    };
}

function createElement(type, props, ...children) {
    return {
        type,
        props: {
            ...props,
            children: children.map((child) => {
                return typeof child === "string" ? createTextNode(child) : child;
            }),
        },
    };
}

let root = null;
let nextWorkOfUnit = null;
function workLoop(dealline) {
    let shouldYield = false;
    while(!shouldYield && nextWorkOfUnit) {
        nextWorkOfUnit = performWorkOfUnit(nextWorkOfUnit)

        shouldYield = dealline.timeRemaining() < 1;
    }
    if(!nextWorkOfUnit && root) {
        commitRoot();
    }
    requestIdleCallback(workLoop);
}

function commitRoot() {
    commitWork(root.child);
    root = null;
}

function commitWork(fiber) {
    if(!fiber) return;
    commitWork(fiber.child);
    commitWork(fiber.sibling);
}

requestIdleCallback(workLoop);

function createDom(type) {
    return type === "TEXT_ELEMENT"
    ? document.createTextNode("")
    : document.createElement(type);
}

function updateProps(dom, props) {
    Object.keys(props).forEach((key) => {
        if(key !== "children") {
            dom[key] = props[key];
        }
    });
}

function initChildren(fiber) {
    const children = fiber.props.children;
    let prevChild = null;
    children.forEach((child, index) => {
        const newFiber = {
            type: child.type,
            props:child.props,
            child: null,
            parent: fiber,
            sibling: null,
            dom: null,
        };

        if(index === 0) {
            fiber.child = newFiber;
        } else {
            prevChild.sibling = newFiber;
        }
        prevChild = newFiber;
    })
}

function performWorkOfUnit(fiber) {
    if(!fiber.dom) {
        const dom = (fiber.dom = createDom(fiber.type));
        fiber.parent.dom.append(dom);
        updateProps(dom, fiber.props);
    }
    initChildren(fiber);
    // 返回下一个要执行的任务
    if(fiber.child) {
        return fiber.child
    }

    if(fiber.sibling) {
        return fiber.sibling
    }

    return fiber.parent?.sibling
}

function render(el, container) {
    nextWorkOfUnit = {
        dom: container,
        props: {
            children: [el],
        }
    };
    root = nextWorkOfUnit
}

const React = {
    render,
    createElement,
};

export default React;