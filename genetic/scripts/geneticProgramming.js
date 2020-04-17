var controllerManager;

function getSignature(c) {
    return c.map(i=>i.uid).join("");
}


function getSwappableIDs(op, result) {
    if (!controllerManager.terminalOperators[op.type]) {
        result.push(op.uid);
        getSwappableIDs(op.op0, result);
        if (op.op1) getSwappableIDs(op.op1, result);
    }
    return result;
}

function getNode(op, id) {
    if (!op) return undefined;
    if (op.uid == id) return op;
    else return (getNode(op.op0, id) || getNode(op.op1, id));
}

function geneticProgrammingMutate(scoredPopulation, replicationChance = 1, crossoverChance = 1, mutationChance = 1, elitism = 1) {
    let sum = replicationChance + crossoverChance + mutationChance;
    replicationChance = replicationChance / sum;
    mutationChance = mutationChance / sum;
    crossoverChance = crossoverChance / sum;

    let selectionChanceArray = scoredPopulation.map((v, i) => [i, v[1]]);
    let total = selectionChanceArray.reduce((p, i) => p + i[1], 0);
    let cumulative = 0;
    console.log(selectionChanceArray);
    selectionChanceArray = selectionChanceArray.map(v => {
        let oldCumulative = cumulative;
        cumulative += v[1] / total;
        return [v[0], oldCumulative];
    });
    console.log(selectionChanceArray);
    function querySelectionChanceArray(n) {
        return selectionChanceArray.reduce((p, v) => (n > v[1]) ? v[0] : p, 0);
    }

    let newPopulation = [];
    for (let i = 0; i < elitism; i++) {
        newPopulation.push(scoredPopulation[i][0]);
        console.log(`E:${i}(${Math.floor(scoredPopulation[i][1])})=>${i}`);
    }
    for (let i = 0; i < scoredPopulation.length; i++) {
        //copy over successful ones
        let currentIndex = querySelectionChanceArray(Math.random());
        let currentController = scoredPopulation[currentIndex][0];
        let operationToPerform = Math.random();
        if (operationToPerform > replicationChance + mutationChance) {
            //crossover
            let otherIndex = querySelectionChanceArray(Math.random());
            let otherController = scoredPopulation[otherIndex][0];
            console.log(`C:${currentIndex}(${Math.floor(scoredPopulation[currentIndex][1])}),${otherIndex}(${Math.floor(scoredPopulation[otherIndex][1])})=>${newPopulation.length}`);
            currentController = JSON.parse(JSON.stringify(currentController))
            otherController = JSON.parse(JSON.stringify(otherController))
            for (let j = 0; j < 10; j++) {
                let subCtrlNo = Math.floor(Math.random() * currentController.length);
                let currentSCTRL = currentController[subCtrlNo];
                let otherSCTRL = otherController[subCtrlNo];
                //crossover 10 random 'genes'
                // recursively check if the operator ID's are the same
                // if they are, push the operator ID onto a list
                let IDs = getSwappableIDs(currentSCTRL, []);
                let otherIDs = getSwappableIDs(otherSCTRL, []);
                IDs = IDs.filter(i => otherIDs.indexOf(i) != -1);
                if (IDs.length == 0) {
                    break;//huh, nothing to swap. these guys are probably different species; abort!
                }
                // Pick a random operatorID
                let randomID = IDs[Math.floor(Math.random() * IDs.length)];
                let node = getNode(currentSCTRL, randomID);
                let otherNode = getNode(otherSCTRL, randomID);
                // swap its either left or right operand with the other one.
                let nodeToSwap = 0;
                if (otherNode.op1 && Math.random() > 0.5) {
                    nodeToSwap = 1;
                }
                let tempCopy = node['op' + nodeToSwap];
                node['op' + nodeToSwap] = otherNode['op' + nodeToSwap];
                otherNode['op' + nodeToSwap] = tempCopy;
            }
            newPopulation.push(currentController);
            newPopulation.push(otherController);
            i++;
        } else if (operationToPerform > replicationChance) {
            //mutate
            console.log(`M:${currentIndex}(${Math.floor(scoredPopulation[currentIndex][1])})=>${newPopulation.length}`);
            currentController = JSON.parse(JSON.stringify(currentController));
            for (let i = 0; i < 10; i++) {
                let currentSCTRL = currentController[Math.floor(Math.random() * currentController.length)];
                let IDs = getSwappableIDs(currentSCTRL, []);
                let randomID = IDs[Math.floor(Math.random() * IDs.length)];
                let node = getNode(currentSCTRL, randomID);
                controllerManager.createController(node, node.tf);
            }
            newPopulation.push(currentController);
        } else {
            console.log(`R:${currentIndex}(${Math.floor(scoredPopulation[currentIndex][1])})=>${newPopulation.length}`);
            //replicate
            newPopulation.push(JSON.parse(JSON.stringify(currentController)));
        }
    }
    //sometimes with a crossover we get one extra person in the new population; trim them off
    while (newPopulation.length > scoredPopulation.length) newPopulation.pop();
    return newPopulation; // filler for now
}