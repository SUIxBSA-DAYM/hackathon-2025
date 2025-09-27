
module tickets_package::user{
    use std::string::String;
    //use tickets_package::tickets_package::Nft;
    

    /// Crée un user
    public struct User has store {
        role: u8, // 0 = "Client" or 1 = "Organizer"
        username: String
    }

    /// Définition d'un client
    public struct Client has key {
        id: UID,
        user: User,
        username: String,
        is_active: bool,
        //history: vector<Nft> // Historique des tickets achetés
    }

    public struct Organizer has key {
        id: UID,
        url: String,
        user: User,
        username: String,
        events: vector<address>, // Liste des événements organisés
    }

        /// Créer un nouveau user
    public fun create_user(ctx: &mut TxContext, username: String, url: String ) 
    {
     let user = User {
        role: 0, // 0 pour Client
        username,
      };
      let client = Client {
            user,
            username: user.username,
            id: object::new(ctx),
            is_active: true,
       };
       move_to(account, client);
    }

    /// Créer un nouvel organisateur
    public fun create_organizer( ctx: &mut TxContext, url: String, events: vector<address> )
    {
        let user = User {
            role: 1, // 1 pour Organizer
            username,
        };
        let organizer = Organizer {
            id: object::new(ctx),
            url: String::utf8( " " ),
            events: vector::empty<address>(),
            user,
            username: user.username,
            };
        move_to(account, organizer);
    }


    /// Mettre à jour les informations du client
    public fun update_client(client: &mut Client, username: vector<String>, email: vector<String>, phone: vector<String>) {
        client.username = username;
    }

    /// Désactiver le client
 ///   public fun deactivate_client(client: &mut Client) {
    //    client.is_active = false;
    //}

    /// Activer le client
    public fun activate_client(client: &mut Client) {
        client.is_active = true;
    }
    
    // Vérifier si le client est actif
    public fun is_client_active(client: &Client): bool {
        client.is_active
    

    }

    public fun add_event(organizer: &mut Organizer, event: address) {
        vector::push_back(&mut organizer.events, event);
    }

} 