import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Dimensions,
} from 'react-native';
import { Card, Title, Paragraph, Chip } from 'react-native-paper';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [listings, setListings] = useState([]);
  const [stats, setStats] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [listingsRes, statsRes] = await Promise.all([
        api.get('/market/listings?limit=5'),
        api.get('/market/stats'),
      ]);
      setListings(listingsRes.data);
      setStats(statsRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Welcome Section */}
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeText}>Welcome, {user?.name}!</Text>
        <Text style={styles.subText}>Find the best grains in the market</Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Icon name="store" size={30} color="#2E7D32" />
          <Text style={styles.statNumber}>{stats?.totalListings || 0}</Text>
          <Text style={styles.statLabel}>Active Listings</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="cash" size={30} color="#2E7D32" />
          <Text style={styles.statNumber}>
            ${stats?.averagePrice?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.statLabel}>Avg. Price</Text>
        </View>
        <View style={styles.statCard}>
          <Icon name="grains" size={30} color="#2E7D32" />
          <Text style={styles.statNumber}>{stats?.topGrains?.length || 0}</Text>
          <Text style={styles.statLabel}>Top Grains</Text>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Market')}
        >
          <Icon name="store-search" size={30} color="#2E7D32" />
          <Text style={styles.actionText}>Browse Market</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('CreateListing')}
        >
          <Icon name="plus-circle" size={30} color="#2E7D32" />
          <Text style={styles.actionText}>Sell Grains</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('Orders')}
        >
          <Icon name="clipboard-list" size={30} color="#2E7D32" />
          <Text style={styles.actionText}>My Orders</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Listings */}
      <View style={styles.recentSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Listings</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Market')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>

        {listings.map((listing) => (
          <TouchableOpacity
            key={listing._id}
            onPress={() => navigation.navigate('ListingDetail', { id: listing._id })}
          >
            <Card style={styles.listingCard}>
              <Card.Content>
                <View style={styles.listingHeader}>
                  <Title>{listing.grain?.name}</Title>
                  <Chip icon="cash" style={styles.priceChip}>
                    ${listing.price}/{listing.unit}
                  </Chip>
                </View>
                <Paragraph>{listing.grain?.description?.slice(0, 100)}...</Paragraph>
                <View style={styles.listingFooter}>
                  <View style={styles.listingInfo}>
                    <Icon name="map-marker" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {listing.location?.city}, {listing.location?.state}
                    </Text>
                  </View>
                  <View style={styles.listingInfo}>
                    <Icon name="weight" size={16} color="#666" />
                    <Text style={styles.infoText}>
                      {listing.quantity} {listing.unit}s available
                    </Text>
                  </View>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  welcomeSection: {
    padding: 20,
    backgroundColor: '#2E7D32',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  subText: {
    fontSize: 16,
    color: '#c8e6c9',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    marginTop: -20,
  },
  statCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 5,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2E7D32',
    marginTop: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginTop: 15,
    borderRadius: 15,
    elevation: 2,
  },
  actionButton: {
    alignItems: 'center',
  },
  actionText: {
    marginTop: 5,
    fontSize: 12,
    color: '#333',
  },
  recentSection: {
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  seeAll: {
    color: '#2E7D32',
    fontWeight: 'bold',
  },
  listingCard: {
    marginBottom: 10,
    elevation: 2,
  },
  listingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  priceChip: {
    backgroundColor: '#e8f5e9',
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  listingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
});
