import { Command, Context } from 'koishi'
import { Queue, QueueElement } from '../components/Queue'
import { cmdType } from './Index'
import { ProcessManager } from "../components/ProcessManager";

export function apply(ctx: Context, main: Command<never, never, string[], {}>) {
    main
        .subcommand('.event [date: string]')
        .alias('vndb.e', 'event')
        .action(async ({ session }, date: string) => {

            const today = new Date();
            const year = today.getFullYear();

            let month: number, day: number;
            if (!date) {
                month = today.getMonth() + 1;
                day = today.getDate();
            } else {
                const dateStr = date.split('-');
                month = Number(dateStr[0]);
                day = Number(dateStr[1]);
            }
            const whole = `${year}-${month}-${day}`;
            const dateList: Array<string | string[]> = ['or'];
            for (let index = year - 1; index >= 2000; index--) {
                dateList.push(['released', '=', `${index}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`]);
            }

            const queue = new Queue(ctx, session);
            const node: QueueElement = {
                type: cmdType.Event,
                value: whole,
                running: false,
                field: ['vn', 'character'],
                filters: [
                    ['and', dateList, ['rating', '>=', ctx.config.lowestRating]],
                    ['birthday', '=', [month, day]]
                ]
            }

            queue.enQueue(node);

            new ProcessManager(ctx, session, queue).startListening();
        })
}