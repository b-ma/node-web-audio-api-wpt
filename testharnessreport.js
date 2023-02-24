/* global add_completion_callback */
/* global setup */

/*
 * This file is intended for vendors to implement code needed to integrate
 * testharness.js tests with their own test systems.
 *
 * Typically test system integration will attach callbacks when each test has
 * run, using add_result_callback(callback(test)), or when the whole test file
 * has completed, using
 * add_completion_callback(callback(tests, harness_status)).
 *
 * For more documentation about the callback functions and the
 * parameters they are called with see testharness.js
 */

const STATUSES = {
    0: 'OK',
    1: 'ERROR',
    2: 'TIMEOUT',
    3: 'PRECONDITION_FAILED'
};

function dump_test_results(tests, status) {
    // console.log(tests, status);
    // var results_element = document.createElement("script");
    // results_element.type = "text/json";
    // results_element.id = "__testharness__results__";
    var test_results = tests.map(function(x) {
        return { name: x.name, status: x.status, message: x.message, stack: x.stack }
    });

    var data = {
        test: process.testName,
        tests: test_results,
        status: status.status,
        message: status.message,
        stack: status.stack
    };

    // console.log(data);
    let passed = data.tests.filter(t => t.status === 0);
    let failed = data.tests.filter(t => t.status !== 0);

    console.log(`
# ${data.test}

- passed: ${passed.length}
- failed: ${failed.length}
\
${failed.map(t => {
    return `  > ${t.name} (status = ${STATUSES[t.status]}) - ${t.message}`;
}).join('\n')}
    `)

    // console.log(JSON.stringify(data, null, 2));

    // To avoid a HierarchyRequestError with XML documents, ensure that 'results_element'
    // is inserted at a location that results in a valid document.
    // var parent = document.body
    //     ? document.body                 // <body> is required in XHTML documents
    //     : document.documentElement;     // fallback for optional <body> in HTML5, SVG, etc.

    // parent.appendChild(results_element);
}

add_completion_callback(async (tests, status) => {
    dump_test_results(tests, status);

    // manually close contexts
    for (let name in process) {
        if (name.startsWith('__AudioContext_')) {
            const context = process[name];
            await context.close()
        }
    }
});

/* If the parent window has a testharness_properties object,
 * we use this to provide the test settings. This is used by the
 * default in-browser runner to configure the timeout and the
 * rendering of results
 */
try {
    if (window.opener && "testharness_properties" in window.opener) {
        /* If we pass the testharness_properties object as-is here without
         * JSON stringifying and reparsing it, IE fails & emits the message
         * "Could not complete the operation due to error 80700019".
         */
        setup(JSON.parse(JSON.stringify(window.opener.testharness_properties)));
    }
} catch (e) {
}
// vim: set expandtab shiftwidth=4 tabstop=4:

