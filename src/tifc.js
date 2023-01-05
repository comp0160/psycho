/**
 * @title tifc
 * @description two interval forced choice
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
import { show_spot } from './shared/drawing.js';
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

        `<p>In this experiment, you are asked to determine<br>
         which of two grey spots is brighter. The spots are shown<br>
         <i>separately</i>, one after the other. After both spots<br>
         have been shown, you will be asked for your response.</p>
         <p>Press the <b>left arrow key</b> if the first spot shown was brighter,<br>
         or the <b>right arrow key</b> if the second one was.</p>
        `,

        `<p>There are 100 trials in the experiment and it will take<br>
        a few minutes to complete.</p>
        <p>Try to focus on the experiment. Be as accurate as you can but do not<br>
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
                type: CanvasKeyboardResponsePlugin,
                stimulus: function (c)
                {
                    let lum = jsPsych.timelineVariable('lum1');
                    let col = chroma('#fff').luminance(lum).rgb()[0];
                    show_spot ( c, col, 9 );
                },
                choices: 'NO_KEYS',
                trial_duration: 3000,
                post_trial_gap: 1000,
                data: { task: 'interval_1' },
            },
            {
                type: CanvasKeyboardResponsePlugin,
                stimulus: function (c)
                {
                    let lum = jsPsych.timelineVariable('lum2');
                    let col = chroma('#fff').luminance(lum).rgb()[0];
                    show_spot ( c, col, 9 );
                },
                choices: 'NO_KEYS',
                trial_duration: 3000,
                post_trial_gap: 500,
                data: { task: 'interval_2' },
            },
            {
                type: HTMLKeyboardResponsePlugin,
                stimulus: '<p>Now enter your response</p>',
                choices: [ 'arrowleft', 'arrowright' ],
                post_trial_gap: 500,
                data: {
                    lum1: jsPsych.timelineVariable('lum1'),
                    lum2: jsPsych.timelineVariable('lum2'),
                    diff: jsPsych.timelineVariable('diff'),
                    correct_response: jsPsych.timelineVariable('correct_response'),
                    task: 'response'
                },
                on_finish: function(data) {
                    data.correct = jsPsych.pluginAPI.compareKeys(data.response, data.correct_response);
                    data.right = jsPsych.pluginAPI.compareKeys(data.response, 'arrowright');
                },
            },
        ],

    };
    
    let timeline_vars = [];
    for ( let ii = 0; ii < REPS; ++ii )
    {
        let lum1 = Math.random();
        let lum2 = Math.random();
        let correct_response = lum1 > lum2 ? 'arrowleft' : 'arrowright';
        timeline_vars.push({
            lum1: lum1,
            lum2: lum2,
            correct_response: correct_response,
            diff: lum2 - lum1
        });
    }
        
    timeline.push({
        timeline: [ single_trial ],
        timeline_variables: timeline_vars,
    });

    timeline.push(...spots_finish());
    timeline.push( simple_scatter (jsPsych,
        {
            download_name: 'comp160_lab1_2ifc.csv',
            stim_name: 'diff',
            response_name: 'right',
            blurb: 'The chart below plots your response as a function of the luminance difference.',
            columns: [ 'rt', 'lum1', 'lum2', 'correct_response', 'correct', 'right', 'diff', 'response', 'time_elapsed' ],
            xlab: 'Difference',
            ylab: 'Response',
            factor: 1
        }));
    timeline.push( goto_url(RETURN_PAGE) );

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    //return jsPsych;
}
