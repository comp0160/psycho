/**
 * @title limits
 * @description Grey level detection threshold estimation by method of limits
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import { initJsPsych } from "jspsych";
import { saveAs } from 'file-saver';

// local shared code
import { single_spot, spots_setup, spots_finish, spots_chart } from './shared/experimenta.js';


/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */
export async function run({ assetPaths, input = {}, environment, title, version })
{
    // kludgy configuration switch for testing
    const QUICK_TEST = true;
    const [ GREY_MIN, GREY_MAX, GREY_STEP, REPS ] = QUICK_TEST ? [ 5, 15, 3, 1 ] : [ 0, 20, 1, 3 ];
    
    const instructions = QUICK_TEST ? null :
    [
        `<p>Welcome to this COMP0160 lab experiment.</p>
         <p>Click <b>Next</b> (or press your <b>right arrow</b> key) to begin.</p>
         `,
     
        `<p>This experiment will use the
        <a href="https://en.wikipedia.org/wiki/Psychophysics#Method_of_limits">Method
        of Limits</a><br>
        to estimate a visual detection threshold.</p>
        <p>You will be shown a sequence of stimuli consisting<br>
        of grey circular spots of varying brightnesses, against a<br>
        black background. In the first part of the experiment the spot<br>
        will start out dark and get slowly brighter, while in the<br>
        second part the spot will start out bright and get dimmer.<br>
        Both parts will repeat three times.</p>
        <p>After each stimulus you will be asked to click a button to<br>
        report whether you saw a spot.</p>
        `,
    
        `<p>There are approximately 60 trials in this experiment<br>
        (the exact number may vary depending on your responses)<br>
        and it will take a few minutes to complete.</p>
        <p>Try to focus on the experiment -- you might find it helpful to<br>
        run your browser in full screen mode.</p>
        <p>Answer honestly but do not worry about occasional errors and<br>
        uncertainty. <b>This is not a test!</b>
        `,
    
        `<p>NB: data from this experiment is collected only in memory in this<br>
        browser on your own computer. It will not be reported elsewhere and no<br>
        personally identifying information is stored.</p>
        <p>At the end of the experiment you will be given the opportunity to save the<br>
        results to a CSV file for further analysis if you wish. This is not mandatory.<br>
        If you choose not to do so, the data cannot be recovered later.<br>
        But you can always run the experiment again to obtain new data.</p>
        `,
    
        `<p>Press <b>Next</b> to begin the experiment.</p>`
    
    ];
    
    const [ jsPsych, timeline ] = spots_setup ( instructions );

    // set of grey values to be tested for spot visibility
    var colours = [];
    for ( let ii = GREY_MIN; ii < GREY_MAX; ii += GREY_STEP )
    {
        colours.push( { colour: ii } );
    }
    
    // start at bottom and increase until seen
    const spots_up =
    {
        timeline: single_spot(jsPsych),
        timeline_variables: colours,
        data: { direction : 'up' },
        on_finish: function (data)
        {
            if ( data.response == 1 )  { jsPsych.endCurrentTimeline(); }
        }
    };
    
    // start at top and decrease until not seen
    const spots_down =
    {
        timeline: single_spot(jsPsych),
        timeline_variables: colours.slice().reverse(),
        data: { direction : 'down' },
        on_finish: function (data)
        {
            if ( data.response == 0 ) { jsPsych.endCurrentTimeline(); }
        }
    };
    
    // repeat up and down cycle REPS times
    const spots_up_down =
    {
        timeline: [ spots_up, spots_down ],
        repetitions: REPS
    };
    
    timeline.push(spots_up_down);
    timeline.push(...spots_finish());
    timeline.push(spots_chart(jsPsych, colours));

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    return jsPsych;
}
