function engine(controllerManager, visualisation=true) {
    //Instantiate the system
    this.physicsEngine = new physicsEngine(visualisation);
    let phySteps = 500;

    this.evaluateOneTimestep = (controller, steps, resolve) => {
        if (steps == phySteps) resolve();
        else {
            let params = {};
            for (let i = 0; i < this.physicsEngine.bodies.length; i++) {
                params['part' + i] = {
                    x: this.physicsEngine.bodies[i].GetPosition().get_x(),
                    y: this.physicsEngine.bodies[i].GetPosition().get_y(),
                    t: this.physicsEngine.bodies[i].GetAngle(),
                    dx: this.physicsEngine.bodies[i].GetLinearVelocity().get_x(),
                    dy: this.physicsEngine.bodies[i].GetLinearVelocity().get_y(),
                    dt: this.physicsEngine.bodies[i].GetAngularVelocity()
                }
            }
            params['bodyHeight'] = 20;
            params['time'] = steps;
            let controlInputs = controller.map(i => controllerManager.evaluateController(i, params));
            //apply the control inputs
            for (let i = 0; i < controlInputs.length; i++) {
                let toApply=Math.max(Math.min(controlInputs[i],100),-100)*300;
                this.physicsEngine.bodies[i].ApplyTorque(toApply);
            }
            this.physicsEngine.step();

            //calculate the score
            let pos=this.physicsEngine.bodies[4].GetPosition();
            pos={x:pos.get_x(),y:pos.get_y()};
            if (pos.y > 15 && pos.x>40) this.currentScore += (pos.x-40)*pos.y;
            setTimeout(() => { this.evaluateOneTimestep(controller, steps + 1, resolve) });
        }
    }

    this.evaluateController = async (controller) => {
        this.physicsEngine.resetSystem();
        // A controller consists of 4 different control outputs.
        this.currentScore = 0;

        //instead of using a for loop, we will use setTimeout to update our game, so that we can see what is going on. 
        let simulate = async () => {
            return new Promise(res => {
                setTimeout(() => { this.evaluateOneTimestep(controller, 0, res) });
            })
        };
        await simulate();
        return this.currentScore;
    }

}