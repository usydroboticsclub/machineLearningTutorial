function _controllerManager() {

    function guid(count = 6, priorkeys) {
        let pool = "1234567890qwertyuiopasdfghjklzxcvbnm";
        do {
            tguid = "";
            for (i = 0; i < count; i++) tguid += pool[Math.floor(Math.random() * pool.length)];
        } while (priorkeys && (priorkeys[i] ||
            (priorkeys.length != undefined && priorkeys.includes(i))
        ));
        return tguid;
    }

    this.terminalOperators = {
        c0: {
            f: () => 0,
        },
        c1: {
            f: () => 1,
        },
        c2: {
            f: () => 2,
        },
        c10: {
            f: () => 10,
        }
    };
    //Add the parameter retrievals
    let params = ['x', 'y', 'dx', 'dy', 't', 'dt'];
    for (let i = 0; i < 4; i++) {
        let ii = i;
        for (let q = 0; q < params.length; q++) {
            let qq = params[q];
            this.terminalOperators['c' + ii + qq] = { f: (_, __, p) => p['part' + ii][qq] };
        }
    }
    this.terminalOperators['t'] = { f: (_, __, p) => p['time'] };
    this.terminalOperators['BH'] = { f: (_, __, p) => p['bodyHeight'] }; // body height

    let nonTerminalOps = {};
    nonTerminalOps['+'] = {
        f: (a, b) => a + b
    };
    nonTerminalOps['-'] = {
        f: (a, b) => a + b
    };
    nonTerminalOps['*'] = {
        f: (a, b) => a * b
    };
    nonTerminalOps['/'] = {
        f: (a, b) => (b == 0) ? 0 : (a / b)
    };
    nonTerminalOps['sin'] = {
        f: (a) => Math.sin(a)
    };
    nonTerminalOps['>'] = {
        f: (a,b) => (a>b)?1:0
    };
    nonTerminalOps['<'] = {
        f: (a,b) => (a<b)?1:0
    };
    /*nonTerminalOps['tan'] = {
        f: (a) => Math.tan(a)
    };*/

    this.operators = {};
    Object.assign(this.operators, this.terminalOperators);
    Object.assign(this.operators, nonTerminalOps);
    this.operators['baseOperator'] = {
        f: (a) => a
    }
    let terminationDecayRate = 0.9;
    this.createController = (root, terminationFactor) => {
        let expectedOperands = this.operators[root.type].f.length;
        if (this.terminalOperators[root.type]) {
            //this accesses params, so its a terminal function
            //do nothing
            //we should never reach here; alert us if we do
            console.log("WARNING! Trying to expand terminal operator");
        } else {
            for (let i = 0; i < expectedOperands; i++) {
                if (Math.random() > terminationFactor) {
                    //take a random operator
                    root['op' + i] = { type: Object.keys(nonTerminalOps)[Math.floor(Math.random() * Object.keys(nonTerminalOps).length)], uid: guid(), tf: terminationFactor };
                    this.createController(root['op' + i], 1 - (1 - terminationFactor) * terminationDecayRate);
                } else {
                    //take a terminal operator
                    root['op' + i] = { type: Object.keys(this.terminalOperators)[Math.floor(Math.random() * Object.keys(this.terminalOperators).length)], uid: guid(), tf: terminationFactor };
                    //it does not need op0 and op1; in fact it shouldn't have it
                }
            }
        }
    }

    this.createNewController = () => {
        let controller = [];
        for (let i = 0; i < 4; i++) {
            let root = { type: 'baseOperator', uid: guid(), tf: 0 };
            this.createController(root, 0);
            controller.push(root);
        }
        return controller;
    }
    this.evaluateController = (controller, params) => {
        if (!controller) return undefined; // for terminal nodes, their op1 and op2 will be undefined.
        return this.operators[controller.type].f(this.evaluateController(controller.op0, params), this.evaluateController(controller.op1, params), params);
    }

    this.printController = (controller) => {
        if (controller.op1){
            return "(" + this.printController(controller.op0) +controller.type + this.printController(controller.op1) + ")";
        }else if (controller.op0){
            return controller.type + "(" + this.printController(controller.op0) + ")";
        }else{
            return controller.type;
        }

        return 
    }

    this.printFullController = (controller) => {
        return controller.map(i => this.printController(i)).join("<br>");
    }
}