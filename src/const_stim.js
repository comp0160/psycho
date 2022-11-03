/**
 * @title const_stim
 * @description Grey level detection threshold estimation by constant stimuli
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import { initJsPsych } from "jspsych";
import { saveAs } from 'file-saver';

// local shared code
import { single_spot, spots_setup, spots_finish, single_dataset_chart, goto_url } from './shared/experimenta.js';

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
    
    const [ GREY_MIN, GREY_MAX, GREY_STEP, REPS ] = QUICK_TEST ? [ 5, 15, 3, 1 ] : [ 0, 20, 1, 4 ];
    
    const instructions = QUICK_TEST ? null :
    [
        `<p>Welcome to this COMP0160 lab experiment.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,

        `<p>This experiment will use the
        <a href="https://en.wikipedia.org/wiki/Psychophysics#Method_of_constant_stimuli">Method
        of Constant Stimuli</a><br>
        to estimate a visual detection threshold.</p>
        <p>You will be shown a sequence of stimuli consisting<br>
        of grey circular spots of different brightnesses, against a<br>
        black background. Sometimes the spot will be clearly visible, sometimes<br>
        it will be dim, and sometimes there may be no spot at all.</p>
        <p>After each stimulus you will be asked to click a button to<br>
        report whether you saw a spot.</p>
        `,

        `<p>There are 80 trials in this experiment and it will take a few<br>
        minutes to complete.</p>
        <p>Try to focus on the experiment. Answer honestly but do not worry
        about occasional errors and<br> uncertainty. <b>This is not a test!</b>
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
            
    // set of grey values to be tested for spot visibility
    var colours = [];
    for ( let ii = GREY_MIN; ii < GREY_MAX; ii += GREY_STEP )
    {
        colours.push( { colour: ii } );
    }
    
    // run a bunch of trials
    const spots =
    {
        timeline: single_spot(jsPsych),
        timeline_variables: colours,
        randomize_order: true,
        repetitions: REPS
    };

    timeline.push(spots);
    timeline.push(...spots_finish());
    timeline.push( single_dataset_chart(jsPsych, colours, {download_name: 'comp160_lab1_const_stim.csv'}) );
    timeline.push( goto_url(RETURN_PAGE) );

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    //return jsPsych;
}
