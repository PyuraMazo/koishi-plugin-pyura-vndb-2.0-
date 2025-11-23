import { Context, Session } from 'koishi'
import { cmdType } from '../commands/Index'


export class Queue {
    private ctx: Context;
    private session: Session;
    private queue: Array<QueueElement>;
    private manager: QueueManager;


    constructor(_ctx: Context, _sess: Session) {
        this.ctx = _ctx;
        this.session = _sess;
        this.manager = QueueManager.getInstance();
        const res = this.manager.withdrawQueue(_sess.channelId);
        if (res) this.queue = res;
        else {
            this.queue = new Array<QueueElement>();

            this.manager.registerQueue(this.session.channelId, this.queue);
        }
    }

    enQueue(node: QueueElement) {
        this.queue.push(node);
        this.session.send(`关键词「${node.value}」已经加入队列。`);
    }

    // 运行元素出队并获取出队元素
    deQueue(key: string): QueueElement {
        for (let index = 0; index < this.queue.length; index++) {
            if (!this.queue[index].running) {
                continue;
            }

            if (this.queue[index].value === key) {
                const e = this.queue.splice(index, 1)[0];
                if (this.queue.length === 0) this.manager.deregisterQueue(this.session.channelId);

                return e;
            }
        }
        throw new Error('未能删除指定任务!');
    }

    // 获取下一个任务，并激活运行
    next(): QueueElement | null {
        for (let index = 0; index < this.queue.length; index++) {
            if (!this.queue[index].running) {
                this.queue[index].running = true;
                return this.queue[index];
            }
        }
        return null;
    }

    chechStatus(): boolean {
        for (let i = 0; i < this.ctx.config.processNumber; i++) {
            if (!this.queue[i].running) {
                return true;
            }
        }

        return false;
    }

    cleanAll() {
        while (this.queue.length !== 0) {
            this.queue.shift();
        }
        this.manager.deregisterQueue(this.session.channelId);
    }
}

export class QueueManager {
    private manager = new Map<string, Array<QueueElement>>();

    private static Instance: QueueManager;

    private constructor() { }

    static getInstance(): QueueManager {
        if (!QueueManager.Instance) {
            QueueManager.Instance = new QueueManager();
        }
        return QueueManager.Instance;
    }

    checkMap(session: Session): string {
        if (!session.channelId) throw new Error("错误的频道id！");

        let len = 0;
        const run = new Array<string>();
        if (this.manager.has(session.channelId)) {
            this.manager.get(session.channelId).forEach((e: QueueElement) => {
                len++;
                if (e.running) run.push(`「${e.value}」`);
            })

            return `当前队列共有${len}个任务，正在进行${run.join('、')}...`;
        } else return '当前频道无搜索队列。';
    }

    registerQueue(id: string, queue: Array<QueueElement>) {
        if (id) this.manager.set(id, queue);
        else throw new Error("错误的频道id！");
    }

    deregisterQueue(id: string) {
        if (id) this.manager.delete(id);
        else throw new Error("错误的频道id！");
    }

    withdrawQueue(id: string): Array<QueueElement> | null {
        if (id) {
            if (this.manager.has(id)) return this.manager.get(id);
            else return null;
        }
        else throw new Error("错误的频道id！");
    }
}


export interface QueueElement {
    type: cmdType,
    value: string,
    running: boolean,
    field?: string | string[],
    method?: any,
    filters?: any
}

export default Queue;