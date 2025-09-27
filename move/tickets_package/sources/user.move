
module tickets_package::user{
    use std::string::String;
    ///use tickets_package::create_Nft::Nft;
    

    /// Crée un user
    public struct User has store {
        role: u8, // 0 = "Client" or 1 = "Organizer"
        username: String
    }

    /// Définition d'un client
    public struct Client has key {
        id: UID,
        user: User,
        &client.user.username
               // Composition: Client "has a" User
        is_active: bool,
        //history: vector<Ticket> // Historique des tickets achetés
    }

    public struct Organizer has key {
        id: UID,
        url: String,
        events: vector<address> // Liste des événements organisés
    }

        /// Créer un nouveau user
    public fun create_user( account: &signer, username: String, url: String ) 
    {
     let user = User {
        role: 0, // 0 pour Client
        username,
      };
      let client = Client {
            user,
            username,
            id: signer::address_of(account),
            is_active: true,
       };
       move_to(account, client);

       let organizer = Organizer {
            id: signer::address_of(account),
            url: String::utf8(""),
            events: vector::empty<address>(),
       };
         move_to(account, organizer);
    }


    /// Mettre à jour les informations du client
    public fun update_client(client: &mut Client, username: vector<String>, email: vector<String>, phone: vector<String>) {
        client.username = username;
    }

    /// Désactiver le client
    public fun deactivate_client(client: &mut Client) {
        client.is_active = false;
    }

    /// Activer le client
    public fun activate_client(client: &mut Client) {
        client.is_active = true;
    }

}
