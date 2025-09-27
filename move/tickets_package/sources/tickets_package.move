/*
/// Module: tickets_package
module tickets_package::tickets_package;
*/

// For Move coding conventions, see
// https://docs.sui.io/concepts/sui-move-concepts/conventions


module tickets_package::tickets_package {
    use std::string::{Self, String};
    use sui::table::{Self, Table};
    use sui::test_scenario as ts;

    // --- Errors ---
    /// Error thrown when the lengths of the places and capacities vectors do not match.
    const EPlaceNameCapacityLengthMismatch: u64 = 400;

    public struct Event has key, store {
        id: UID,
        name: String,
        location: String, // format (float, float)
        time: String,
        organizer: address,
        category: String,
        inventory: Inventory
    }

    public struct Inventory has key, store {
        id: UID,
        owner: address,                  // organizers of the event are the owners of the inventory
        total_capacity: u64,
        places: Table<Place, vector<Nft>>  // map place IDs to NFT vectors
    }

    public struct Place has store, copy, drop {
        capacity: u64,
        name: String
    }

    public struct Nft has key, store {
        id: UID,
        event: address,
        creation_date: String,
        owner: address,
        organizer: address,
        used: bool,
        name: String
    }

    public struct NFTMinted has copy, drop {
        // The Object ID of the NFT
        object_id: ID,
        // The creator of the NFT
        creator: address,
        // The name of the NFT
        name: String,
    }

    /// Create a new nft ticket, only the organization owner should call this function
    /// TODO: add checks to ensure only the organizer can create an NFT for their event
    public fun create_nft(name: String, event: address, creation_date: String, owner: address, ctx: &mut TxContext): Nft {
        Nft {
            id: object::new(ctx),
            event: event,
            creation_date: creation_date,
            owner: owner,
            organizer: owner,
            used: false,
            name: name
        }
    }

    /// Create a new event, only the organization owner should call this function
    public fun create_event(
        name: String,
        location: String,
        time: String,
        category: String,
        places: vector<String>,
        capacities: vector<u64>,
        ctx: &mut TxContext
    ): Event {
        assert!(vector::length(&places) == vector::length(&capacities), EPlaceNameCapacityLengthMismatch);
        let owner = ctx.sender();
        let mut inventory = Inventory {
            id: object::new(ctx),
            owner,
            total_capacity: 0,
            places: table::new<Place, vector<Nft>>(ctx)
        };
        let event_id = object::new(ctx);
        let mut idx = 0;
        while (idx < vector::length(&places)) {
            let place = Place {
                capacity: *vector::borrow(&capacities, idx),
                name: *vector::borrow(&places, idx)
            };
            table::add(&mut inventory.places, place, vector::empty<Nft>());
            let mut idx2 = 0;
            while (idx2 < place.capacity) {
                let nft = create_nft(place.name, object::uid_to_address(&event_id), time, owner, ctx);
                let nft_vector = table::borrow_mut(&mut inventory.places, place);
                vector::push_back(nft_vector, nft);
                idx2 = idx2 + 1;
            };
            inventory.total_capacity = inventory.total_capacity + place.capacity;
            idx = idx + 1;
        };
        let event = Event {
            id: event_id,
            name,
            location,
            time,
            organizer: owner,
            category,
            inventory
        };
        event
    }

    #[test]
    fun test_create_event_success() {
        let owner = @0x1;
        let mut ts = ts::begin(owner);
        let ctx = ts.ctx();
        let places = vector[string::utf8(b"Main Hall"), string::utf8(b"Side Room")];
        let capacities = vector[2, 1];
        let event = create_event(
            string::utf8(b"Dev Meetup"),
            string::utf8(b"37.7749,-122.4194"), // Example coordinates
            string::utf8(b"2024-07-01T18:00:00Z"),
            string::utf8(b"Tech"),
            places,
            capacities,
            ctx
        );
        assert!(event.name == string::utf8(b"Dev Meetup"), 1);
        assert!(event.inventory.total_capacity == 3, 0);
        ts.return_to_sender(event);
        ts.end();
        // Optionally, check more properties...
    }


}


