export async function executeWithTimeout(func, timeout = 300000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('Operation filed with timed out'));
    }, timeout);

    func().then(
      (result) => {
        clearTimeout(timer);
        resolve(result);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}

export default executeWithTimeout;