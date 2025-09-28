#[test_only]
module tickets_package::user_tests {

    // uncomment this line to import the module
    use std::debug;
    use tickets_package::user::create_organizer;
    use sui::test_scenario;
    use std::string;
    use tickets_package::user::Organizer;
    use tickets_package::user::Client;
    use tickets_package::user::{Self, create_client};
    use tickets_package::user::get_client_username;
    use tickets_package::user::get_organizer_username;
    use tickets_package::user::get_client_status;
    use tickets_package::user::get_organizer_status;
    

    #[test]
    fun test_create_organizer_success() {
        let owner: address = @0x1;
        let mut ts = test_scenario::begin(owner);
        let ctx = ts.ctx();
        create_organizer(string::utf8(b"https//example.com"),  string::utf8(b"qenhrgdt"), owner, ctx); 
        ts.next_tx(owner);
        let mut organizer = ts.take_from_sender<Organizer>();
        assert!(organizer.get_organizer_username() == string::utf8(b"qenhrgdt"), 1);
        assert!(organizer.get_organizer_status() == true, 0);
        ts.return_to_sender(organizer);
        ts.end();
        // Optionally, check more properties...
    }

    #[test]
    fun test_create_client_success() {
        let owner = @0x1;
        let mut ts = test_scenario::begin(owner);
        let ctx = ts.ctx();
        create_client(string::utf8(b"user123"),  string::utf8(b"https//client.com"), owner, ctx); 
        ts.next_tx(owner);
        let mut client = ts.take_from_sender<Client>();
        assert!(client.get_client_username() == string::utf8(b"user123"), 1);
        assert!(client.get_client_status() == true, 0);
        transfer::public_transfer(client, owner);
        ts.end();
        // Optionally, check more properties...
    }

    #[test]
    fun test_update_organizer_username() {
        let owner = @0x1;
        let mut ts = test_scenario::begin(owner);
        let ctx = ts.ctx();
        create_organizer(string::utf8(b"https//example.com"),  string::utf8(b"old_name"), owner, ctx); 
        ts.next_tx(owner);
        let mut organizer = ts.take_from_sender<Organizer>();
        user::update_organizer(&mut organizer, string::utf8(b"new_name"));
        assert!(organizer.get_organizer_username() == string::utf8(b"new_name"), 1);
        transfer::public_transfer(organizer, owner);
        ts.end();
    }

    #[test]
    fun test_update_client_username() {
        let owner = @0x1;
        let mut ts = test_scenario::begin(owner);
        let ctx = ts.ctx();
        create_client(string::utf8(b"old_user"),  string::utf8(b"https//client.com"), owner, ctx); 
        ts.next_tx(owner);
        let mut client = ts.take_from_sender<Client>();
        user::update_client(&mut client, string::utf8(b"new_user"));
        let usrnm = client.get_client_username();
        debug::print(usrnm);
        debug::print_stack_trace();
        assert!(usrnm == &string::utf8(b"new_user"), 1);
        transfer::public_transfer(client, owner);
        ts.end();
    }



}
