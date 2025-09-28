module tickets_package::user{
    //use tickets_package::tickets_package::Nft;
    use std::string::String;

    /// Crée un user
    public struct User has store, drop {
        role: u8, // 0 = "Client" or 1 = "Organizer"
        username: String
    }

    /// Définition d'un client
    public struct Client has key {
        id: UID,
        username: String,
        is_active: bool,
        //history: vector<Nft> // Historique des tickets achetés
    } 

    public struct Organizer has key, store {
        id: UID,
        username: String,
        url: String,
        events: vector<address>, // Liste des événements organisés
    }

        /// Créer un nouveau user
    public fun create_user(username: String, url: String, ctx: &mut TxContext) 
    {
     let user = User {
        role: 0, // 0 pour Client
        username: username,
      };
      let client = Client {
            username: user.username,
            id: object::new(ctx),
            is_active: true,
       };
       transfer::share_object(client);
    }

    /// Créer un nouvel organisateur
    public fun create_organizer( url: String, username: String, ctx: &mut TxContext ): Organizer
    {
        let user = User {
            role: 1, // 1 pour Organizer
            username: username,
        };
        Organizer {
            id: object::new(ctx),
            url: url,
            events: vector::empty<address>(),
            username: user.username,
        }
        // recall avec &mut organizer
    }


    /// Mettre à jour les informations du client
    public fun update_user(client: &mut User, username: String) {
        client.username = username;
    }

    // Désactiver le client
 //   public fun deactivate_client(client: &mut Client) {
    //    client.is_active = false;
    //}

    /// Activer le client
    public fun activate_client(client: &mut Client) {
        client.is_active = true;
    }
    
    // Vérifier si le client est actif
    public fun is_client_active(client: &Client) {
        client.is_active && true;
    }

    public fun add_event(organizer: &mut Organizer, event: address) {
        vector::push_back(&mut organizer.events, event);
    }

} 