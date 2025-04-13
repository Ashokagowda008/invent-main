    const fs = require('fs');
	const path = require('path');
	const logFilePath = path.join(__dirname, '/../public/log.txt'); 
	const maxLogFileSize = 50000;
/**
 * 
 * @After(event = { "CREATE","READ","UPDATE","DELETE" }, entity = "MxP_PoC_RolesService.Entity1")
 * @param {(Object|Object[])} results - For the After phase only: the results of the event processing
 * @param {Object} request - User information, tenant-specific CDS model, headers and query parameters
*/

const purchinfo_log = async function(message) {
	// Your code here
	// logMessage(`[${request.method}] ${request.path}`);
	logMessage(`[${message.type}] ${message.message}`);

}
const getLogs = async function() {
	// Your code here
	var data = await fs.readFileSync(logFilePath, 'utf8');
	return data.toString();
}

// Check and rotate log file if it exceeds the maximum size
function logMessage(message) {
	console.log(message)
	fs.stat(logFilePath, (err, stats) => {
		// console.log(err)
	  if (!err) {
		// Read the current log file
		fs.readFile(logFilePath, 'utf8', (readErr, data) => {
		  if (!readErr) {
			// Create a new log entry
			const timestamp = new Date().toISOString();
			const logEntry = `[${timestamp}] ${message}\n`;		
			// Prepend the new log entry to the existing log data
			const newData = logEntry + data;
			// Write the updated data back to the log file
			fs.writeFile(logFilePath, newData.substring(0,maxLogFileSize), (writeErr) => {
				console.log("Success")
			  if (writeErr) {
				console.error('Error writing to the log file:', writeErr);
			  }
			});
		  }
		});
	  }
	});
  }

  module.exports = {purchinfo_log, getLogs}
