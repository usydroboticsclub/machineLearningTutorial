function physicsEngine(visualisation) {

    function createPolygonShape(vertices) {
        var shape = new Box2D.b2PolygonShape();
        var buffer = Box2D.allocate(vertices.length * 8, 'float', Box2D.ALLOC_STACK);
        var offset = 0;
        for (var i = 0; i < vertices.length; i++) {
            Box2D.setValue(buffer + (offset), vertices[i].get_x(), 'float'); // x
            Box2D.setValue(buffer + (offset + 4), vertices[i].get_y(), 'float'); // y
            offset += 8;
        }
        var ptr_wrapped = Box2D.wrapPointer(buffer, Box2D.b2Vec2);
        shape.Set(ptr_wrapped, vertices.length);
        return shape;
    }

    let c = document.querySelector("canvas");
    c.width = 500;
    c.height = 500;
    let ctx = c.getContext('2d');

    //make a world
    var world = new Box2D.b2World(new Box2D.b2Vec2(0.0, -10.0));

    //Make the universe background anchor
    //var groundBody = world.CreateBody(new Box2D.b2BodyDef());

    // Make the floor
    var bodyDef = new Box2D.b2BodyDef();
    //bodyDef.set_type(Box2D.b2_dynamicBody);
    var body = world.CreateBody(bodyDef);
    var fixtureDef = new b2FixtureDef();
    var edgeShape = new b2EdgeShape();
    edgeShape.Set(new b2Vec2(-20000, -12), new b2Vec2(2000, -12));
    fixtureDef.set_shape(edgeShape);
    fixtureDef.get_filter().set_categoryBits(0xff);
    body.CreateFixture(fixtureDef);

    //Make a box
    var bodyDef = new Box2D.b2BodyDef();
    bodyDef.set_type(Box2D.b2_dynamicBody);

    var verts = [];
    verts.push(new Box2D.b2Vec2(0, -2.5));
    verts.push(new Box2D.b2Vec2(10, -2.5));
    verts.push(new Box2D.b2Vec2(10, 2.5));
    verts.push(new Box2D.b2Vec2(0, 2.5));
    var polygonShape = createPolygonShape(verts);
    var fixtureDef = new b2FixtureDef();
    fixtureDef.set_density(2.5);
    fixtureDef.set_friction(0.6);
    fixtureDef.get_filter().set_categoryBits(0x01);
    fixtureDef.get_filter().set_maskBits(0x10);
    fixtureDef.set_shape(polygonShape);
    let basePositions = [
        new Box2D.b2Vec2(40, 0),
        new Box2D.b2Vec2(40, 0),
        new Box2D.b2Vec2(42, 12),
        new Box2D.b2Vec2(42, 12),
        new Box2D.b2Vec2(47, 24),
    ]
    this.bodies = [];
    for (let i = 0; i < 5; i++) {
        if (i == 4) fixtureDef.set_density(5);
        this.bodies.push(world.CreateBody(bodyDef));
        this.bodies[i].CreateFixture(fixtureDef);
        this.bodies[i].SetTransform(basePositions[i], -Math.PI / 2);
    }
    //join all parts together
    var jointDef2 = new b2RevoluteJointDef();
    jointDef2.set_bodyA(this.bodies[0]);
    jointDef2.set_bodyB(this.bodies[1]);
    jointDef2.set_localAnchorA(new b2Vec2(12, 0));
    jointDef2.set_localAnchorB(new b2Vec2(-2, 0));
    jointDef2.set_collideConnected(false);
    jointDef2.set_enableLimit(true);
    jointDef2.set_lowerAngle(-Math.PI / 2);
    jointDef2.set_upperAngle(0);
    var revoluteJoint2 = Box2D.castObject(world.CreateJoint(jointDef2), b2WheelJoint);

    var jointDef2 = new b2RevoluteJointDef();
    jointDef2.set_bodyA(this.bodies[2]);
    jointDef2.set_bodyB(this.bodies[3]);
    jointDef2.set_localAnchorA(new b2Vec2(12, 0));
    jointDef2.set_localAnchorB(new b2Vec2(-2, 0));
    jointDef2.set_collideConnected(false);
    jointDef2.set_enableLimit(true);
    jointDef2.set_lowerAngle(-Math.PI / 2);
    jointDef2.set_upperAngle(0);
    var revoluteJoint2 = Box2D.castObject(world.CreateJoint(jointDef2), b2WheelJoint);

    var jointDef2 = new b2RevoluteJointDef();
    jointDef2.set_bodyA(this.bodies[0]);
    jointDef2.set_bodyB(this.bodies[2]);
    jointDef2.set_localAnchorA(new b2Vec2(-2, 0));
    jointDef2.set_localAnchorB(new b2Vec2(-2, 0));
    jointDef2.set_collideConnected(false);
    jointDef2.set_enableLimit(true);
    jointDef2.set_lowerAngle(-Math.PI / 6);
    jointDef2.set_upperAngle(Math.PI / 6);
    var revoluteJoint2 = Box2D.castObject(world.CreateJoint(jointDef2), b2WheelJoint);

    var jointDef2 = new b2RevoluteJointDef();
    jointDef2.set_bodyA(this.bodies[4]);
    jointDef2.set_bodyB(this.bodies[0]);
    jointDef2.set_localAnchorA(new b2Vec2(12, 0));
    jointDef2.set_localAnchorB(new b2Vec2(-2, 0));
    jointDef2.set_collideConnected(false);
    jointDef2.set_enableLimit(true);
    jointDef2.set_lowerAngle(0);
    jointDef2.set_upperAngle(Math.PI / 2);
    var revoluteJoint2 = Box2D.castObject(world.CreateJoint(jointDef2), b2WheelJoint);

    let tt = 0;
    //add feet
    var verts = [];
    verts.push(new Box2D.b2Vec2(0, 0));
    verts.push(new Box2D.b2Vec2(2, 0));
    verts.push(new Box2D.b2Vec2(2, 7));
    verts.push(new Box2D.b2Vec2(0, 7));
    var polygonShape = createPolygonShape(verts);
    var fixtureDef = new b2FixtureDef();
    fixtureDef.set_density(2.5);
    fixtureDef.set_friction(1);
    fixtureDef.get_filter().set_categoryBits(0x01);
    fixtureDef.get_filter().set_maskBits(0x10);
    fixtureDef.set_shape(polygonShape);
    let basePosition2 = new Box2D.b2Vec2(40, -10);
    for (let i = 0; i < 2; i++) {
        this.bodies.push(world.CreateBody(bodyDef));
        this.bodies[5 + i].CreateFixture(fixtureDef);
        this.bodies[5 + i].SetTransform(basePosition2, 0);
    }


    var jointDef2 = new b2RevoluteJointDef();
    jointDef2.set_bodyA(this.bodies[5]);
    jointDef2.set_bodyB(this.bodies[1]);
    jointDef2.set_localAnchorA(new b2Vec2(0, 0));
    jointDef2.set_localAnchorB(new b2Vec2(12, 0));
    jointDef2.set_collideConnected(false);
    jointDef2.set_enableLimit(true);
    jointDef2.set_lowerAngle(-Math.PI / 2 - 0.1);
    jointDef2.set_upperAngle(-Math.PI / 2 + 0.1);
    var revoluteJoint2 = Box2D.castObject(world.CreateJoint(jointDef2), b2WheelJoint);

    var jointDef2 = new b2RevoluteJointDef();
    jointDef2.set_bodyA(this.bodies[6]);
    jointDef2.set_bodyB(this.bodies[3]);
    jointDef2.set_localAnchorA(new b2Vec2(0, 0));
    jointDef2.set_localAnchorB(new b2Vec2(12, 0));
    jointDef2.set_collideConnected(false);
    jointDef2.set_enableLimit(true);
    jointDef2.set_lowerAngle(-Math.PI / 2 - 0.1);
    jointDef2.set_upperAngle(-Math.PI / 2 + 0.1);
    var revoluteJoint2 = Box2D.castObject(world.CreateJoint(jointDef2), b2WheelJoint);

    // sim
    this.resetSystem = () => {
        for (let i = 0; i < 5; i++) {
            this.bodies[i].SetTransform(basePositions[i], -Math.PI / 2);
        }
        for (let i = 0; i < 2; i++) {
            this.bodies[5 + i].SetTransform(basePosition2, 0);
        }
        tt = 0;
    }

    this.step = () => {
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, 500, 500);
        world.Step(0.1, 8, 3);
        if (visualisation) {
            for (let i = 0; i < this.bodies.length; i++) {
                if (i==4)ctx.strokeStyle="red";
                else ctx.strokeStyle="black";
                let b = this.bodies[i];
                let cx = b.GetPosition().get_x() + 20;
                let cy = b.GetPosition().get_y() + 20;
                let angle = b.GetAngle();
                ctx.beginPath();
                let xx = [10, 10, 0, 0];
                let yy = [0, 5, 5, 0];
                if (i > 4) {
                    xx = [7, 7, 0, 0];
                    yy = [2, 2, 0, 0];
                }
                ctx.moveTo(cx + xx[3] * Math.cos(angle) - yy[3] * Math.sin(angle), 500 - (cy + xx[3] * Math.sin(angle) + yy[3] * Math.cos(angle)));
                for (let i = 0; i < 4; i++) {
                    ctx.lineTo(cx + xx[i] * Math.cos(angle) - yy[i] * Math.sin(angle), 500 - (cy + xx[i] * Math.sin(angle) + yy[i] * Math.cos(angle)));
                }
                ctx.stroke();
                ctx.closePath();
            }
            ctx.beginPath();
            ctx.moveTo(0,500-15);
            ctx.lineTo(500,500-15);
            ctx.closePath();
            ctx.stroke();
        }
    }
}