export default class GameBall {
    constructor(data) {
        this.lastX = 0;
        this.lastY = 20;
        this.speed = 1;
        this.direction = [1, 1];
        Object.assign(this, data);
    }

    get nextX() {
        const computedNextX = (this.lastX + this.direction[0])*this.speed;
        this.lastX = computedNextX;
        return computedNextX;
    }

    get nextY() {
        const computedNextY = (this.lastY + this.direction[1])*this.speed;
        this.lastY = computedNextY;
        return computedNextY;
    }
}