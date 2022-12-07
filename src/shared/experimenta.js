/* building elements used by multiple experiments */

import HtmlKeyboardResponsePlugin from "@jspsych/plugin-html-keyboard-response";
import HtmlButtonResponsePlugin from "@jspsych/plugin-html-button-response";
import CanvasKeyboardResponsePlugin from "@jspsych/plugin-canvas-keyboard-response";
import CallFunctionPlugin from "@jspsych/plugin-call-function";
import InstructionsPlugin from "@jspsych/plugin-instructions";
import FullscreenPlugin from "@jspsych/plugin-fullscreen";
import PreloadPlugin from "@jspsych/plugin-preload";
import { initJsPsych } from "jspsych";

import Chart from 'chart.js/auto';

import { show_spot, set_page_background, set_body_text  } from './drawing.js';


export function single_spot ( jsPsych )
{   
    function random_duration ()
    {
        return jsPsych.randomization.sampleWithoutReplacement([750, 1000, 1250, 1500], 1)[0];
    }
    
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
    
    return [ pause, spot, pause, query ];
}

export function spots_setup ( pages, assetPaths=null )
{
    const jsPsych = initJsPsych();
    const timeline = [];
    
    // preload if needed
    if ( assetPaths )
    {
        timeline.push({
            type: PreloadPlugin,
            images: assetPaths.images,
            audio: assetPaths.audio,
            video: assetPaths.video,
        });
    }
    
    // show instructions, if provided
    if ( pages )
    {
        timeline.push({
            type: InstructionsPlugin,
            pages: pages,
            show_clickable_nav: true
        })
    }

    // Switch to fullscreen
    timeline.push({
        type: FullscreenPlugin,
        fullscreen_mode: true,
        message: `<p>The experiment will attempt to switch to<br>
                  <b>full screen</b> mode when you press the button.<br>
                  This may not be supported on all browsers.<br>
                  If it fails, just continue in ordinary window mode.</p>`
    });
    
    // set background to black
    timeline.push({
        type: CallFunctionPlugin,
        func: function ()
        {
            set_page_background("#000");
            set_body_text("#888");
        }
    });
    
    timeline.push({
        type: HtmlKeyboardResponsePlugin,
        stimulus: "",
        choices: "NO_KEYS",
        trial_duration: 1000,
    });
    
    return [ jsPsych, timeline ];
}

export function spots_finish ()
{
    const timeline =
    [
        // reset background
        {
            type: CallFunctionPlugin,
            func: function ()
            {
                set_page_background("#fff");
                set_body_text("#000");
            }
        },
        
        // exit fullscreen
        {
            type: FullscreenPlugin,
            fullscreen_mode: false
        }
    ];
    
    return timeline;
}

export function goto_url ( url )
{
    return { type: CallFunctionPlugin, func: function () { window.location = url; }};
}

export function single_dataset_chart ( jsPsych, stims,
    {
        stim_name = 'colour',
        blurb = 'The chart below shows your mean detection vs stimulation intensity.',
        columns = ['rt', 'direction', 'colour', 'response', 'time_elapsed'],
        xlab = 'Stimulus',
        ylab = '% Detection',
        factor = 100,
        download_name = 'responses.csv'
    } = {} )
{
    const charting =
    {
        type: HtmlKeyboardResponsePlugin,
        stimulus:
            `<p>${blurb}</p>
             <p />
             <p><a href="#" onclick="saveAs(new Blob([sessionStorage.getItem('csv')], {type: 'text/csv;charset=utf-8'}), '${download_name}');">Click
                here</a> to download your response data in CSV format.</p>
             <p>Press any key to complete the experiment. Thank you!</p>
             <div style="display: flex; justify-content: center;">
             <div class="chart-container" style="position: relative; height:40vh; width:60vw;">
                <canvas id="chart_canvas"></canvas>
             </div>
             </div>`,
        on_load:  function ()
        {
            let trials = jsPsych.data.get().filter({task: 'response'}).filterColumns(columns);
            sessionStorage.setItem('csv', trials.csv());
        
            let pts = []
        
            for ( let stim of stims )
            {
                let stim_trials = trials.filter({ [stim_name]: stim[stim_name] });
                pts.push( { x: stim[stim_name], y: factor * stim_trials.select('response').mean() } );
            }
        
            const data =
            {
                datasets: [{
                    label: 'Spot Visibility',
                    backgroundColor: '#1f78b4aa',
                    radius: 10,
                    borderColor: '#1f78b4aa',
                    data: pts,
                }],
            };
        
            const options =
            {
                scales:
                {
                    x: { title: { display: true, text: xlab } },
                    y: { title: { display: true, text: ylab } }
                },
                plugins:
                {
                    legend: { display: false }
                }
            };
            
            const config = { type: 'scatter', data: data, options: options };
            const chart = new Chart( document.getElementById('chart_canvas'), config );
        }
    };
    
    return charting;
}

export function multi_dataset_chart ( jsPsych, groups,
    {
        stim_name = 'colour',
        blurb = 'The chart below shows your mean detection vs stimulation intensity.',
        columns = ['rt', 'direction', 'colour', 'response', 'time_elapsed'],
        xlab = 'Stimulus',
        ylab = '% Detection',
        factor = 100,
        download_name = 'responses.csv',
        group_name = 'group',
        colours = [ '#e31a1caa', '#1f78b4aa', '#b2df8aaa', '#fdbf6faa' ],
        show_legend = true,
    } = {} )
{
    const charting =
    {
        type: HtmlKeyboardResponsePlugin,
        stimulus:
            `<p>${blurb}</p>
             <p />
             <p><a href="#" onclick="saveAs(new Blob([sessionStorage.getItem('csv')], {type: 'text/csv;charset=utf-8'}), '${download_name}');">Click
                here</a> to download your response data in CSV format.</p>
             <p>Press any key to complete the experiment. Thank you!</p>
             <div style="display: flex; justify-content: center;">
             <div class="chart-container" style="position: relative; height:40vh; width:60vw;">
                <canvas id="chart_canvas"></canvas>
             </div>
             </div>`,
        on_load:  function ()
        {
            let trials = jsPsych.data.get().filter({task: 'response'}).filterColumns(columns);
            sessionStorage.setItem('csv', trials.csv());
            
            const data = { datasets: [] };
            
            for ( let ii = 0; ii < groups.length; ++ii )
            {
                let group = groups[ii];
                let group_trials = trials.filter({ [group_name]: group });
                
                let group_stims = group_trials.select(stim_name).values;
                let group_responses = group_trials.select('response').values;
                
                let pts = [];
                
                for ( let jj = 0; jj < group_stims.length; ++jj )
                {
                    pts.push( { x: group_stims[jj], y: factor * group_responses[jj] } );
                }
                
                console.log(group_stims, group_responses);
                
                data.datasets.push(
                    {
                        label: group,
                        backgroundColor: colours[ii],
                        radius: 10,
                        borderColor: colours[ii],
                        data: pts,
                    }
                );
                
                console.log(data);
            }
            
            const options =
            {
                scales:
                {
                    x: { title: { display: true, text: xlab } },
                    y: { title: { display: true, text: ylab } }
                },
                plugins:
                {
                    legend: { display: show_legend }
                }
            };
        
            const config = { type: 'scatter', data: data, options: options };
            const chart = new Chart( document.getElementById('chart_canvas'), config );
        }
    };
    
    return charting;
}


export function simple_scatter ( jsPsych,
    {
        stim_name = 'colour',
        blurb = 'The chart below shows your detection vs stimulation intensity.',
        columns = ['rt', 'direction', 'colour', 'response', 'time_elapsed'],
        xlab = 'Stimulus',
        ylab = '% Detection',
        factor = 100,
        download_name = 'responses.csv',
        colour = '#e31a1caa',
        show_legend = false,
        label = 'responses',
        response_name = 'response',
        task_name = 'response',
    } = {} )
{
    const charting =
    {
        type: HtmlKeyboardResponsePlugin,
        stimulus:
            `<p>${blurb}</p>
             <p />
             <p><a href="#" onclick="saveAs(new Blob([sessionStorage.getItem('csv')], {type: 'text/csv;charset=utf-8'}), '${download_name}');">Click
                here</a> to download your response data in CSV format.</p>
             <p>Press any key to complete the experiment. Thank you!</p>
             <div style="display: flex; justify-content: center;">
             <div class="chart-container" style="position: relative; height:40vh; width:60vw;">
                <canvas id="chart_canvas"></canvas>
             </div>
             </div>`,
        on_load:  function ()
        {
            let trials = jsPsych.data.get().filter({task: task_name}).filterColumns(columns);
            sessionStorage.setItem('csv', trials.csv());
            
            let stims = trials.select(stim_name).values;
            let responses = trials.select(response_name).values;
            let pts = [];
            
            for ( let ii = 0; ii < stims.length; ++ii )
            {
                pts.push( { x: stims[ii], y: factor * responses[ii] } );
            }

            const data =
            { 'datasets' :
                [{
                    label: label,
                    backgroundColor: colour,
                    radius: 10,
                    borderColor: colour,
                    data: pts,
                }],
            };
            
            const options =
            {
                scales:
                {
                    x: { title: { display: true, text: xlab } },
                    y: { title: { display: true, text: ylab } }
                },
                plugins:
                {
                    legend: { display: show_legend }
                }
            };
        
            const config = { type: 'scatter', data: data, options: options };
            const chart = new Chart( document.getElementById('chart_canvas'), config );
        }
    };
    
    return charting;
}