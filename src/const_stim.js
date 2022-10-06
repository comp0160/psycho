/**
 * @title const_stim
 * @description Grey level detection threshold estimation by constant stimuli
 * @version 0.1.0
 *
 * @assets assets/
 */

// You can import stylesheets (.scss or .css).
import "../styles/main.scss";

import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import CanvasKeyboardResponsePlugin from "@jspsych/plugin-canvas-keyboard-response";
import CallFunctionPlugin from "@jspsych/plugin-call-function";
import InstructionsPlugin from "@jspsych/plugin-instructions";
import PreloadPlugin from "@jspsych/plugin-preload";
import { initJsPsych } from "jspsych";

// non-jsPsych stuff
import { saveAs } from 'file-saver';
import Chart from 'chart.js/auto';

/**
 * This function will be executed by jsPsych Builder and is expected to run the jsPsych experiment
 *
 * @type {import("jspsych-builder").RunFunction}
 */
export async function run({ assetPaths, input = {}, environment, title, version })
{
    const jsPsych = initJsPsych();

    const timeline = [];

    // Preload assets
    timeline.push({
        type: PreloadPlugin,
        images: assetPaths.images,
        audio: assetPaths.audio,
        video: assetPaths.video,
    });
    
    const instructions =
    {
        type: InstructionsPlugin,
        pages:
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
            <p>Try to focus on the experiment -- you might find it helpful to run<br>
            your browser in full screen mode.</p>
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
            
        ],
        show_clickable_nav: true
    };
    timeline.push(instructions);

    // Switch to fullscreen
    timeline.push({
        type: FullscreenPlugin,
        fullscreen_mode: true,
    });

    /* drawing functions */
    function filled_circle (canvas, x, y, radius, color)
    {
        var ctx = canvas.getContext("2d");
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
    }
    
    function canvas_background ( canvas, col )
    {
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = col;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    
    function set_page_background ( col )
    {
        document.body.style.background = col; 
    }
    
    function clear_page_background ()
    {
        set_page_background(null);
    }
    
    function grey_colour ( n ) { return `rgb(${n}, ${n}, ${n})`; }

    function show_spot ( canvas, col, frac )
    {
        var ctx = canvas.getContext("2d");
        var height = ctx.canvas.height;
        var width = ctx.canvas.width;
        filled_circle ( canvas, width/2, height/2, height/frac, grey_colour(col) );
    }
    
    function random_duration ()
    {
        return jsPsych.randomization.sampleWithoutReplacement([750, 1000, 1250, 1500], 1)[0];
    }
    
    const set_to_black =
    {
        type: CallFunctionPlugin,
        func: function () { set_page_background("#000"); }
    };
    
    const unset_from_black =
    {
        type: CallFunctionPlugin,
        func: clear_page_background
    };
    
    /* single spot trial */
    const spot = {
        type: CanvasKeyboardResponsePlugin,
        stimulus: function (c)
        {
            show_spot(c, jsPsych.timelineVariable('colour'), 9);
        },
        canvas_size: [600, 800],
        choices: "NO_KEYS",
        trial_duration: random_duration
    };
    
    const pause =
    {
        type: HtmlKeyboardResponsePlugin,
        stimulus: "",
        choices: "NO_KEYS",
        trial_duration: random_duration
    };
    
    const query =
    {
        type: HtmlButtonResponsePlugin,
        stimulus: "<p style='color: #888'>Did you see a light spot?</p>",
        choices: [ "No", "Yes" ],
        data: { colour: jsPsych.timelineVariable('colour'), task: 'response' }
    };
    
    // configure experiment in one place for dev convenience
    const GREY_MIN = 0;
    const GREY_MAX = 6;
    const GREY_STEP = 2;
    const REPS = 1;
    
    /* set of grey values to be tested for spot visibility */
    var colours = [];
    for ( let ii = GREY_MIN; ii < GREY_MAX; ii += GREY_STEP )
    {
        colours.push( { colour: ii } );
    }
    
    /* run a bunch of trials */
    const spots =
    {
        timeline: [ pause, spot, pause, query ],
        timeline_variables: colours,
        randomize_order: true,
        repetitions: REPS
    };
    
    timeline.push(set_to_black);
    timeline.push(spots);
    timeline.push(unset_from_black);
    
    /* global vars for our trial data extract */
    var trials = null;
    //var blob = null;
    
    const charting =
    {
        type: HtmlKeyboardResponsePlugin,
        stimulus:
            `<p>
                The chart below shows your mean detection vs stimulus intensity.<br>
                Based on what you know from the lectures, does this look<br>
                like a reasonable psychometric function?</p>
             <p>
             <p><a href="#" onclick="saveAs(new Blob([sessionStorage.getItem('csv')], {type: 'text/csv;charset=utf-8'}), 'comp160_lab1_expt1.csv');">Click
                here</a> to download your response data in CSV format.</p>
             <p>Press any key to complete the experiment. Thank you!</p>
             <div style="display: flex; justify-content: center;">
             <div class="chart-container" style="position: relative; height:40vh; width:60vw;">
                <canvas id="spot_chart"></canvas>
             </div>
             </div>`,
        on_load: function ()
        {
            trials = jsPsych.data.get().filter({task: 'response'}).filterColumns(['rt', 'colour', 'response', 'time_elapsed']);
            //blob = new Blob([trials.csv()], {type: "text/csv;charset=utf-8"});
            sessionStorage.setItem('csv', trials.csv());
            
            let pts = []
            
            for ( let bb of colours )
            {
                let bb_trials = trials.filter({ colour: bb.colour });
                pts.push( { x: bb.colour, y: 100 * bb_trials.select('response').mean() } );
            }
            
            const data =
            {
                datasets: [{
                    label: 'Spot Visibility',
                    backgroundColor: 'rgb(255, 99, 132)',
                    radius: 10,
                    borderColor: 'rgb(255, 99, 132)',
                    data: pts,
                }],
            };
            
            const options =
            {
                scales:
                {
                    x: { title: { display: true, text: 'Brightness' } },
                    y: { title: { display: true, text: '% Detection' } }
                },
                plugins:
                {
                    legend: { display: false }
                }
            };
            
            const config = { type: 'scatter', data: data, options: options };
            const chart = new Chart( document.getElementById('spot_chart'), config );
        }
    };
    
    timeline.push(charting);

    await jsPsych.run(timeline);

    // Return the jsPsych instance so jsPsych Builder can access the experiment results (remove this
    // if you handle results yourself, be it here or in `on_finish()`)
    return jsPsych;
}
