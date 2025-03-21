// Função para converter a imagem para Base64
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]); // remove o prefixo "data:image/jpeg;base64,"
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}

// Função para salvar a imagem no Realtime Database
async function saveProfilePicture(userId, file) {
  try {
    // Converte a imagem para base64
    const base64String = await fileToBase64(file);

    // Salva no Realtime Database
    await firebase.database().ref(`usuarios/${userId}`).update({
      fotoPerfil: base64String
    });

    console.log('Imagem salva com sucesso no Realtime Database!');
  } catch (error) {
    console.error('Erro ao salvar a imagem: ', error);
  }
}
