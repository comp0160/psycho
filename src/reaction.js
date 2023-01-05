/**
 * @title reaction
 * @description simple reaction time task
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import CanvasKeyboardResponsePlugin from "@jspsych/plugin-canvas-keyboard-response";
import HTMLKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";

import { initJsPsych } from "jspsych";
import { saveAs } from 'file-saver';
import chroma from 'chroma-js';

// local shared code
import { filled_circle } from './shared/drawing.js';
import { spots_setup, spots_finish, simple_scatter, goto_url } from './shared/experimenta.js';

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */
export async function run({ assetPaths, input = {}, environment, title, version })
{
    // kludgy configuration switch for testing
    const query = new URLSearchParams(window.location.search);
    const QUICK_TEST = query.has('quick');
    const RETURN_PAGE = query.has('home') ? query.get('home') : '/';
    
    const REPS = QUICK_TEST ? 8 : 100;
    
    const instructions = QUICK_TEST ? null :
    [
        `<p>Welcome to this COMP0160 lab experiment.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,

        `<p>In this experiment, you are asked to press the <b>space bar</b><br>
        when you see a grey spot. The spots will vary in brightness<br>
        and location. The duration of each stimulus and the intervals between<br>
        stimuli will also vary.
        </p>
        `,

        `<p>There are 100 trials in the experiment and it will take<br>
        a few minutes to complete.</p>
        <p>Try to focus on the experiment. Be as quick as you can but do not<br>
        worry about occasional errors and uncertainty.
        <b>This is not a test!</b></p>
        `,

        `<p>NB: data from this experiment is collected only in memory in this<br>
        browser on your own computer. It will not be reported elsewhere and no<br>
        personally identifying information is stored.</p>
        <p>At the end of the experiment you will be given the opportunity to save the<br>
        results to a CSV file for further analysis if you wish. This is not mandatory.<br>
        If you choose not to do so, the data cannot be recovered later.<br>
        But you can always run the experiment again to obtain new data.</p>
        `,

//        `<p>Press <b>Next</b> to begin the experiment.</p>`
    ];

    const [ jsPsych, timeline ] = spots_setup ( instructions );
    
    const single_trial =
    {
        timeline: [
            {
                type: HTMLKeyboardResponsePlugin,
                stimulus: '',
                choices: 'NO_KEYS',
                trial_duration: jsPsych.timelineVariable('wait'),
                post_trial_gap: 0,
                data: { task: 'waiting' },
            },
            {
                type: CanvasKeyboardResponsePlugin,
                canvas_size: [600, 900],
                stimulus: function (c)
                {
                    let lum = jsPsych.timelineVariable('lum');
                    let col = chroma('#fff').luminance(lum).hex();
                    
                    let off = jsPsych.timelineVariable('off');
                    let ctx = c.getContext("2d");
                    let height = ctx.canvas.height;
                    let width = ctx.canvas.width;
                    
                    let radius = width / 15;
                    let x = radius + off * 13 * radius;
                    
                    filled_circle ( c, x, height/2, radius, col );
                },
                choices: [ ' ' ],
                trial_duration: jsPsych.timelineVariable('duration'),
                post_trial_gap: 0,
                data: {
                    lum: jsPsych.timelineVariable('lum'),
                    off: jsPsych.timelineVariable('off'),
                    task: 'response',
                },
            },
        ],

    };
    
    let timeline_vars = [];
    for ( let ii = 0; ii < REPS; ++ii )
    {
        let lum = 0.01 + 0.4 * Math.random();
        let off = Math.random();
        let wait = 1500 + 5000 * Math.random();
        let duration = 1000 + 4000 * Math.random();
        
        timeline_vars.push({
            lum: lum,
            off: off,
            wait: wait,
            duration: duration
        });
    }
        
    timeline.push({
        timeline: [ single_trial ],
        timeline_variables: timeline_vars,
    });

    timeline.push(...spots_finish());
    timeline.push( simple_scatter (jsPsych,
        {
            download_name: 'comp160_lab1_react.csv',
            stim_name: 'off',
            response_name: 'rt',
            blurb: 'The chart below plots your reaction time as a function of the lateral position',
            columns: [ 'rt', 'lum', 'off', 'wait', 'duration', 'response', 'time_elapsed' ],
            xlab: 'Relative Position',
            ylab: 'Reaction Time (ms)',
            factor: 1
        }));
    timeline.push( goto_url(RETURN_PAGE) );

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    //return jsPsych;
}
