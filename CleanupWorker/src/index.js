// Export the default object containing the worker methods
export default {
  /**
   * Scheduled event handler that performs periodic cleanup operations on a database of file uploads.
   * This method is triggered at scheduled intervals specified in the worker configuration.
   *
   * @param {Object} event - The event object representing the scheduled trigger.
   * @param {Object} env - The environment object containing bindings and environment variables.
   * @param {Object} ctx - The execution context object, providing methods and properties related to the execution.
   */
  async scheduled(event, env, ctx) {
    // Get the current time in Unix timestamp format (seconds since Jan 1, 1970)
    const currentDateUnix = Math.round(new Date() / 1000);

    // SQL query to fetch all entries from the 'uploads' table
    let query = 'SELECT * FROM uploads';

    // Execute the query using a prepared statement
    const result = await env.DB.prepare(query).run();

    // Check if the query was successful
    if (result.success) {
      // Initialize an array to keep track of entries to remove
      let entriesToRemove = [];

      // Iterate over each file entry in the results
      for (const fileEntry of result.results) {
        // Parse the JSON options associated with the file entry
        let entryOptions = JSON.parse(fileEntry.options);

        // Check if the file should be removed based on its timeout and download conditions
        if (fileEntry.timeout < currentDateUnix || (entryOptions.otd === true && fileEntry.downloadCount > 0)) {
          // Retrieve the file object from the bucket using the filename
          const object = await env.transferbucket.get(fileEntry.filename);

          // If the file object exists, delete it from the storage bucket
          if (object) {
            await env.transferbucket.delete(fileEntry.filename);

            // Add the file ID to the removal list if it's not already there
            if (!entriesToRemove.includes(fileEntry.fileId)) entriesToRemove.push(fileEntry.fileId);
          } else {
            // If the file object does not exist but needs to be removed, add the ID to the removal list
            if (!entriesToRemove.includes(fileEntry.fileId)) entriesToRemove.push(fileEntry.fileId);
          }
        }
      }

      // If there are any entries to remove, proceed with deletion from the database
      if (entriesToRemove.length > 0) {
        for (const entry of entriesToRemove) {
          console.log(`Trying to remove ${entry} from db`);

          // Construct the SQL query to delete the specific entry from the database
          let query = `DELETE FROM uploads WHERE fileId = `;
          query += `"${entry}"`;

          // Execute the deletion query
          await env.DB.prepare(query).run();
        }
      }
    }
  },
};