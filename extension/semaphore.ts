export class Semaphore {
    private resolve: () => void = () => {};
    private promise: Promise<void> = new Promise((resolve) => {
        this.resolve = resolve;
    });

    constructor(private _status: "green" | "red" = "red") {
        if (_status === "green") {
            this.resolve();
        }
    }

    async green() {
        await this.promise;
    }

    signal(signal: "green" | "red" = "green") {
        if (signal === "green" && this._status === "red") {
            this._status = "green";
            this.resolve();
        } else if (signal === "red" && this._status === "green") {
            this._status = "red";
            this.promise = new Promise((resolve) => {
                this.resolve = resolve;
            });
        }
    }

    redUntil(p: Promise<any>) {
        this._status = "red";
        this.promise = p;
        p.then(() => {
            if (this._status === "red") {
                this._status = "green";
                if (this.promise !== p) {
                    this.resolve();
                }
            }
        });
    }

    get status() {
        return this._status;
    }
}