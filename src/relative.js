/**
 * @title relative
 * @description relative magnitude estimation using a slider
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import CanvasSliderResponsePlugin from "@jspsych/plugin-canvas-slider-response";

import { initJsPsych } from "jspsych";
import { saveAs } from 'file-saver';

// local shared code
import { show_two_spots } from './shared/drawing.js';
import { spots_setup, spots_finish, single_dataset_chart, goto_url } from './shared/experimenta.js';

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
    
    const [ REPS, STEP ] = QUICK_TEST ? [ 5, 16 ] : [ 50, 4 ];
    const EDGES = [];
    for ( let ii = 0; ii < 256; ii += STEP ) { EDGES.push(ii); }
    
    const instructions = QUICK_TEST ? null :
    [
        `<p>Welcome to this COMP0160 lab experiment.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,

        `<p>In this experiment you are asked to estimate the<br>
        <b>relative brightness</b> of two grey spots.</p>
        <p>For each trial, adjust the slider so that the proportion<br>
        of the bar on the left hand side matches the proportional<br>
        brightness of the left hand spot. For example if you think<br>
        the left hand spot is twice as bright as the right, you should<br>
        set the slider two thirds of the way across.</p>
        `,

        `<p>There are 50 trials in this experiment and it will take a few<br>
        minutes to complete.</p>
        <p>Try to focus on the experiment. Answer honestly but do not worry<br>
        about occasional errors and uncertainty.
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
        type: CanvasSliderResponsePlugin,
        stimulus: function(c)
        {
            let edge = jsPsych.timelineVariable('edge');
            show_two_spots ( c, edge, 255-edge, 7, 8 );
        },
        min: 0,
        max: 255,
        slider_start: 127,
        slider_width: 600,
        data: { edge: jsPsych.timelineVariable('edge'), task: 'response' },
    };
    
    let edges = jsPsych.randomization.sampleWithReplacement( EDGES, REPS );
    let timeline_vars = [];
    for ( let edge of edges ) { timeline_vars.push({ edge: edge }); }
    
    timeline.push({
        timeline: [ single_trial ],
        timeline_variables: timeline_vars,
    });

    timeline.push(...spots_finish());
    timeline.push( single_dataset_chart (jsPsych, timeline_vars,
        {
            download_name: 'comp160_lab1_relative.csv',
            stim_name: 'edge',
            blurb: 'The chart below plots your estimate vs the true proportion.',
            columns: [ 'rt', 'edge', 'response', 'time_elapsed' ],
            xlab: 'True Split',
            ylab: 'Estimate',
            factor: 1
        }));
    timeline.push( goto_url(RETURN_PAGE) );

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    //return jsPsych;
}
