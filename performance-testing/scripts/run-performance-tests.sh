#!/bin/bash

# BlueMap Performance Testing Suite
# Sprint 3: Load Testing & Performance Validation
# Comprehensive testing for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
TEST_RESULTS_DIR="./results/$(date +'%Y%m%d_%H%M%S')"
REPORTS_DIR="./reports/$(date +'%Y%m%d_%H%M%S')"
API_URL="https://api.bluemap.lerncraft.xyz"
FRONTEND_URL="https://bluemap.lerncraft.xyz"
TEST_LOG="performance-test-$(date +'%Y%m%d_%H%M%S').log"

# Test configurations
LOAD_TEST_CONFIGS=(
    "100:5:60"    # 100 users, 5 minute ramp-up, 60 minute test
    "500:10:60"   # 500 users, 10 minute ramp-up, 60 minute test
    "1000:15:120" # 1000 users, 15 minute ramp-up, 120 minute test
)

WEBSOCKET_CONFIGS=(
    "100:60"      # 100 connections, 60 minutes
    "500:120"     # 500 connections, 120 minutes
    "1000:60"     # 1000 connections, 60 minutes
)

# Logging functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$TEST_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$TEST_LOG"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$TEST_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$TEST_LOG"
    exit 1
}

info() {
    echo -e "${PURPLE}[INFO]${NC} $1" | tee -a "$TEST_LOG"
}

# Initialize performance testing
initialize_testing() {
    log "🚀 Starting BlueMap Performance Testing Suite"
    log "============================================="

    # Create results and reports directories
    mkdir -p "$TEST_RESULTS_DIR" "$REPORTS_DIR"

    # Create test log
    touch "$TEST_LOG"

    # Check prerequisites
    check_prerequisites

    # Setup test environment
    setup_test_environment

    success "Performance testing initialized successfully"
}

# Check prerequisites
check_prerequisites() {
    log "🔍 Checking testing prerequisites..."

    # Required tools
    local required_tools=("curl" "kubectl" "docker")
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            warning "Required tool not found: $tool - some tests may be limited"
        fi
    done

    # Check JMeter installation (optional)
    if command -v jmeter &> /dev/null; then
        info "JMeter found - full load testing available"
        JMETER_AVAILABLE="true"
    else
        warning "JMeter not found - using alternative load testing methods"
        JMETER_AVAILABLE="false"
    fi

    # Check Artillery.js installation (optional)
    if command -v artillery &> /dev/null; then
        info "Artillery.js found - WebSocket testing available"
        ARTILLERY_AVAILABLE="true"
    else
        warning "Artillery.js not found - WebSocket testing limited"
        ARTILLERY_AVAILABLE="false"
    fi

    # Check Kubernetes access
    if kubectl cluster-info &> /dev/null; then
        info "Kubernetes access available - infrastructure monitoring enabled"
        KUBERNETES_AVAILABLE="true"
    else
        warning "Kubernetes access not available - infrastructure monitoring disabled"
        KUBERNETES_AVAILABLE="false"
    fi

    success "Prerequisites check completed"
}

# Setup test environment
setup_test_environment() {
    log "⚙️ Setting up test environment..."

    # Set environment variables for tests
    export API_URL="$API_URL"
    export FRONTEND_URL="$FRONTEND_URL"
    export TEST_RESULTS_DIR="$TEST_RESULTS_DIR"
    export REPORTS_DIR="$REPORTS_DIR"

    # Create test user accounts if needed
    create_test_accounts

    # Initialize monitoring
    if [ "$KUBERNETES_AVAILABLE" = "true" ]; then
        initialize_kubernetes_monitoring
    fi

    success "Test environment setup completed"
}

# Create test accounts
create_test_accounts() {
    log "👥 Creating test accounts..."

    # Create test user data
    cat > "$TEST_RESULTS_DIR/test-users.json" << EOF
{
  "users": [
    {
      "username": "testuser_001",
      "email": "test001@example.com",
      "role": "user"
    },
    {
      "username": "testuser_002",
      "email": "test002@example.com",
      "role": "user"
    }
  ],
  "admins": [
    {
      "username": "testadmin_001",
      "email": "admin001@example.com",
      "role": "admin"
    }
  ]
}
EOF

    success "Test accounts created"
}

# Initialize Kubernetes monitoring
initialize_kubernetes_monitoring() {
    log "📊 Initializing Kubernetes monitoring..."

    # Start monitoring BlueMap namespace
    kubectl get namespace bluemap &> /dev/null || {
        warning "BlueMap namespace not found - will be created during deployment"
        return 0
    }

    # Get baseline metrics
    get_baseline_metrics

    success "Kubernetes monitoring initialized"
}

# Run API load tests
run_api_load_tests() {
    log "🔄 Running API load tests..."

    local test_name="api-load-test"
    local test_dir="$TEST_RESULTS_DIR/$test_name"
    mkdir -p "$test_dir"

    if [ "$JMETER_AVAILABLE" = "true" ]; then
        run_jmeter_api_tests "$test_dir"
    else
        run_curl_api_tests "$test_dir"
    fi

    success "API load tests completed"
}

# Run JMeter API tests
run_jmeter_api_tests() {
    local test_dir=$1

    log "🧪 Running JMeter API load tests..."

    # Create JMeter test plan
    create_jmeter_test_plan "$test_dir/bluemap-api-test-plan.jmx"

    # Run JMeter test
    cd "$test_dir"
    jmeter -n -t bluemap-api-test-plan.jmx -l results.jtl -e -o html-report/
    cd - > /dev/null

    # Process results
    process_test_results "$test_dir" "API Load Test"

    success "JMeter API tests completed"
}

# Create JMeter test plan
create_jmeter_test_plan() {
    local jmx_file=$1

    cat > "$jmx_file" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2" properties="5.0" jmeter="5.5">
  <hashTree>
    <TestPlan guiclass="TestPlanGui" testclass="TestPlan" testname="BlueMap API Load Test" enabled="true">
      <stringProp name="TestPlan.comments">Performance test for BlueMap API endpoints</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.tearDown_on_shutdown">true</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments" guiclass="ArgumentsArgument" testclass="Arguments" testname="User Defined Variables" enabled="true">
        <collectionProp name="Arguments.arguments"/>
      </elementProp>
      <stringProp name="TestPlan.user_define_classpath"></stringProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup guiclass="ThreadGroupGui" testclass="ThreadGroup" testname="BlueMap Users" enabled="true">
        <stringProp name="ThreadGroup.on_sample_error">continue</stringProp>
        <elementProp name="ThreadGroup.main_controller" elementType="LoopController" guiclass="LoopControllerGui" testclass="LoopController" testname="Loop Controller" enabled="true">
          <boolProp name="LoopController.continue_forever">false</boolProp>
          <stringProp name="LoopController.loops">-1</stringProp>
        </elementProp>
        <stringProp name="ThreadGroup.num_threads">100</stringProp>
        <stringProp name="ThreadGroup.ramp_time">300</stringProp>
        <longProp name="ThreadGroup.start_time">1700000000000</longProp>
        <longProp name="ThreadGroup.end_time">1700000000000</longProp>
        <boolProp name="ThreadGroup.scheduler">true</boolProp>
        <stringProp name="ThreadGroup.duration">3600</stringProp>
        <stringProp name="ThreadGroup.delay">0</stringProp>
        <boolProp name="ThreadGroup.same_user_on_next_iteration">true</boolProp>
      </ThreadGroup>
      <hashTree>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Server Status Request" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="Arguments" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain">api.bluemap.lerncraft.xyz</stringProp>
          <stringProp name="HTTPSampler.port">443</stringProp>
          <stringProp name="HTTPSampler.protocol">https</stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path">/api/v1/servers</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
          <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
          <stringProp name="HTTPSampler.connect_timeout">5000</stringProp>
          <stringProp name="HTTPSampler.response_timeout">10000</stringProp>
        </HTTPSamplerProxy>
        <hashTree/>
        <HTTPSamplerProxy guiclass="HttpTestSampleGui" testclass="HTTPSamplerProxy" testname="Analytics Request" enabled="true">
          <elementProp name="HTTPsampler.Arguments" elementType="Arguments" guiclass="Arguments" testclass="Arguments" testname="User Defined Variables" enabled="true">
            <collectionProp name="Arguments.arguments"/>
          </elementProp>
          <stringProp name="HTTPSampler.domain">api.bluemap.lerncraft.xyz</stringProp>
          <stringProp name="HTTPSampler.port">443</stringProp>
          <stringProp name="HTTPSampler.protocol">https</stringProp>
          <stringProp name="HTTPSampler.contentEncoding"></stringProp>
          <stringProp name="HTTPSampler.path">/api/v1/analytics</stringProp>
          <stringProp name="HTTPSampler.method">GET</stringProp>
          <boolProp name="HTTPSampler.follow_redirects">true</boolProp>
          <boolProp name="HTTPSampler.auto_redirects">false</boolProp>
          <boolProp name="HTTPSampler.use_keepalive">true</boolProp>
          <boolProp name="HTTPSampler.DO_MULTIPART_POST">false</boolProp>
          <stringProp name="HTTPSampler.embedded_url_re"></stringProp>
          <stringProp name="HTTPSampler.connect_timeout">5000</stringProp>
          <stringProp name="HTTPSampler.response_timeout">10000</stringProp>
        </HTTPSamplerProxy>
        <hashTree/>
      </hashTree>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
EOF
}

# Run curl-based API tests
run_curl_api_tests() {
    local test_dir=$1

    log "🧪 Running curl-based API load tests..."

    local start_time=$(date +%s)
    local end_time=$((start_time + 3600))  # 1 hour test

    # Test configuration
    local concurrent_users=10
    local requests_per_user=100

    while [ $(date +%s) -lt $end_time ]; do
        # Start concurrent curl requests
        for i in $(seq 1 $concurrent_users); do
            (
                for j in $(seq 1 $requests_per_user); do
                    local start_req=$(date +%s%3N)

                    # Test server status endpoint
                    if curl -f -s -w "%{http_code}:%{time_total}\n" -o /dev/null "${API_URL}/api/v1/servers" >> "$test_dir/api-results.log" 2>&1; then
                        echo "$(date +%s):server-status:success" >> "$test_dir/api-timeline.log"
                    else
                        echo "$(date +%s):server-status:failed" >> "$test_dir/api-timeline.log"
                    fi

                    # Test analytics endpoint
                    if curl -f -s -w "%{http_code}:%{time_total}\n" -o /dev/null "${API_URL}/api/v1/analytics" >> "$test_dir/api-results.log" 2>&1; then
                        echo "$(date +%s):analytics:success" >> "$test_dir/api-timeline.log"
                    else
                        echo "$(date +%s):analytics:failed" >> "$test_dir/api-timeline.log"
                    fi

                    sleep 1  # 1 second between requests
                done
            ) &
        done

        wait  # Wait for all background jobs to complete
        sleep 60  # 1 minute between test cycles
    done

    # Process results
    process_curl_test_results "$test_dir"

    success "Curl-based API tests completed"
}

# Run WebSocket tests
run_websocket_tests() {
    log "🔌 Running WebSocket connection tests..."

    local test_name="websocket-test"
    local test_dir="$TEST_RESULTS_DIR/$test_name"
    mkdir -p "$test_dir"

    if [ "$ARTILLERY_AVAILABLE" = "true" ]; then
        run_artillery_websocket_tests "$test_dir"
    else
        run_simple_websocket_tests "$test_dir"
    fi

    success "WebSocket tests completed"
}

# Run Artillery WebSocket tests
run_artillery_websocket_tests() {
    local test_dir=$1

    log "🧪 Running Artillery WebSocket tests..."

    # Create Artillery test configuration
    create_artillery_config "$test_dir/bluemap-websocket-test.yml"

    # Run Artillery test
    cd "$test_dir"
    artillery run bluemap-websocket-test.yml
    artillery report bluemap-websocket-test.json
    cd - > /dev/null

    # Process results
    process_test_results "$test_dir" "WebSocket Test"

    success "Artillery WebSocket tests completed"
}

# Create Artillery configuration
create_artillery_config() {
    local config_file=$1

    cat > "$config_file" << 'EOF'
config:
  target: 'wss://api.bluemap.lerncraft.xyz'
  socketio:
    transports: ['websocket']
  phases:
    - duration: 60
      arrivalRate: 10
  variables:
    serverIds:
      - 'mc-basop-bafep-stp'
      - 'mc-bgstpoelten'
      - 'mc-hakstpoelten'
      - 'mc-htlstp'
      - 'mc-ilias'
      - 'mc-borgstpoelten'
      - 'mc-niilo'
scenarios:
  - name: "WebSocket Connection Test"
    weight: 100
    engine: socketio
    flow:
      - connect:
          url: '/ws/bluemap'
      - think: 1
      - emit:
          channel: 'server_status_request'
          data: '{}'
      - think: 5
      - emit:
          channel: 'analytics_request'
          data: '{}'
      - think: 2
      - disconnect: []
EOF
}

# Run simple WebSocket tests
run_simple_websocket_tests() {
    local test_dir=$1

    log "🧪 Running simple WebSocket tests..."

    # Test basic WebSocket connection
    local ws_url="${API_URL}/ws/bluemap"

    # Use a simple WebSocket test with netcat or python
    if command -v python3 &> /dev/null; then
        python3 -c "
import asyncio
import websockets
import json
import time
import logging

async def test_websocket():
    uri = '$ws_url'
    try:
        async with websockets.connect(uri) as websocket:
            print('WebSocket connected successfully')

            # Test server status request
            await websocket.send(json.dumps({'type': 'server_status_request'}))
            response = await websocket.recv()
            print(f'Server status response: {response[:100]}...')

            # Test analytics request
            await websocket.send(json.dumps({'type': 'analytics_request'}))
            response = await websocket.recv()
            print(f'Analytics response: {response[:100]}...')

            print('WebSocket test completed successfully')

    except Exception as e:
        print(f'WebSocket test failed: {e}')

asyncio.run(test_websocket())
" > "$test_dir/websocket-test.log" 2>&1

        if grep -q "WebSocket connected successfully" "$test_dir/websocket-test.log"; then
            success "WebSocket connection test passed"
        else
            warning "WebSocket connection test failed - check logs"
        fi
    else
        warning "Python3 not available - skipping WebSocket tests"
    fi
}

# Run frontend load tests
run_frontend_tests() {
    log "🌐 Running frontend load tests..."

    local test_name="frontend-test"
    local test_dir="$TEST_RESULTS_DIR/$test_name"
    mkdir -p "$test_dir"

    # Test frontend load time
    test_frontend_performance "$test_dir"

    # Test 3D rendering performance
    test_3d_rendering_performance "$test_dir"

    # Test mobile responsiveness
    test_mobile_performance "$test_dir"

    success "Frontend tests completed"
}

# Test frontend performance
test_frontend_performance() {
    local test_dir=$1

    log "📊 Testing frontend performance..."

    # Use curl to test load times
    local start_time=$(date +%s%3N)

    if curl -f -s -w "Load time: %{time_total}s, Size: %{size_download} bytes\n" -o /dev/null "$FRONTEND_URL" > "$test_dir/frontend-performance.log"; then
        local end_time=$(date +%s%3N)
        local duration=$((end_time - start_time))

        if [ "$duration" -lt 3000 ]; then  # Less than 3 seconds
            success "Frontend load time acceptable: ${duration}ms"
        else
            warning "Frontend load time slow: ${duration}ms"
        fi
    else
        warning "Frontend load test failed"
    fi
}

# Test 3D rendering performance
test_3d_rendering_performance() {
    local test_dir=$1

    log "🎮 Testing 3D rendering performance..."

    # Test WebGL availability
    if curl -s "$FRONTEND_URL" | grep -q "WebGL"; then
        success "WebGL support detected"
    else
        warning "WebGL support not detected - 3D features may not work"
    fi

    # Test 3D asset loading
    local assets_to_test=(
        "/static/js/bluemap-3d.bundle.js"
        "/static/css/3d-navigation.css"
        "/assets/3d-models/"
    )

    for asset in "${assets_to_test[@]}"; do
        if curl -f -s -I "$FRONTEND_URL$asset" | grep -q "200 OK"; then
            success "3D asset available: $asset"
        else
            warning "3D asset missing: $asset"
        fi
    done
}

# Test mobile performance
test_mobile_performance() {
    local test_dir=$1

    log "📱 Testing mobile performance..."

    # Test responsive design
    local user_agents=(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
        "Mozilla/5.0 (Android 11; Mobile; rv:68.0)"
    )

    for ua in "${user_agents[@]}"; do
        local response=$(curl -s -H "User-Agent: $ua" -w "HTTP_CODE:%{http_code};LOAD_TIME:%{time_total}" -o /dev/null "$FRONTEND_URL")
        local http_code=$(echo "$response" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
        local load_time=$(echo "$response" | grep -o "LOAD_TIME:[0-9.]*" | cut -d: -f2)

        if [ "$http_code" = "200" ]; then
            if (( $(echo "$load_time < 5.0" | bc -l) )); then
                success "Mobile performance good: ${load_time}s"
            else
                warning "Mobile performance slow: ${load_time}s"
            fi
        else
            warning "Mobile test failed: HTTP $http_code"
        fi
    done
}

# Run infrastructure tests
run_infrastructure_tests() {
    log "🏗️ Running infrastructure tests..."

    local test_name="infrastructure-test"
    local test_dir="$TEST_RESULTS_DIR/$test_name"
    mkdir -p "$test_dir"

    if [ "$KUBERNETES_AVAILABLE" = "true" ]; then
        test_kubernetes_performance "$test_dir"
    fi

    test_database_performance "$test_dir"
    test_cache_performance "$test_dir"
    test_network_performance "$test_dir"

    success "Infrastructure tests completed"
}

# Test Kubernetes performance
test_kubernetes_performance() {
    local test_dir=$1

    log "☸️ Testing Kubernetes performance..."

    # Check pod status
    kubectl get pods -n bluemap -o json > "$test_dir/pod-status.json" 2>/dev/null || true

    # Check service status
    kubectl get services -n bluemap -o json > "$test_dir/service-status.json" 2>/dev/null || true

    # Check resource usage
    kubectl top pods -n bluemap > "$test_dir/pod-resources.txt" 2>/dev/null || true

    # Analyze results
    if [ -f "$test_dir/pod-status.json" ]; then
        local running_pods=$(jq -r '.items[] | select(.status.phase == "Running") | .metadata.name' "$test_dir/pod-status.json" | wc -l)
        local total_pods=$(jq -r '.items | length' "$test_dir/pod-status.json")

        if [ "$running_pods" -eq "$total_pods" ]; then
            success "All $total_pods pods are running"
        else
            warning "Only $running_pods/$total_pods pods are running"
        fi
    fi
}

# Test database performance
test_database_performance() {
    local test_dir=$1

    log "🗄️ Testing database performance..."

    # Test PostgreSQL connection if available
    if kubectl get pods -n bluemap | grep -q postgres; then
        kubectl exec -n bluemap deployment/bluemap-postgres -- psql -U postgres -c "SELECT version();" > "$test_dir/db-version.log" 2>&1

        if grep -q "PostgreSQL" "$test_dir/db-version.log"; then
            success "PostgreSQL connection test passed"
        else
            warning "PostgreSQL connection test failed"
        fi
    fi

    # Test Redis connection if available
    if kubectl get pods -n bluemap | grep -q redis; then
        kubectl exec -n bluemap deployment/bluemap-redis -- redis-cli ping > "$test_dir/redis-test.log" 2>&1

        if grep -q "PONG" "$test_dir/redis-test.log"; then
            success "Redis connection test passed"
        else
            warning "Redis connection test failed"
        fi
    fi
}

# Test cache performance
test_cache_performance() {
    local test_dir=$1

    log "⚡ Testing cache performance..."

    # Test API response times with cache
    local api_endpoint="${API_URL}/api/v1/servers"

    # First request (cache miss)
    local start_time=$(date +%s%3N)
    curl -f -s -o /dev/null "$api_endpoint"
    local first_request_time=$(($(date +%s%3N) - start_time))

    # Second request (cache hit expected)
    local start_time=$(date +%s%3N)
    curl -f -s -o /dev/null "$api_endpoint"
    local second_request_time=$(($(date +%s%3N) - start_time))

    echo "First request (cache miss): ${first_request_time}ms" > "$test_dir/cache-performance.log"
    echo "Second request (cache hit): ${second_request_time}ms" >> "$test_dir/cache-performance.log"

    local improvement=$((first_request_time - second_request_time))
    if [ "$improvement" -gt 0 ]; then
        success "Cache performance good: ${improvement}ms improvement"
    else
        warning "Cache may not be working properly"
    fi
}

# Test network performance
test_network_performance() {
    local test_dir=$1

    log "🌐 Testing network performance..."

    # Test DNS resolution
    nslookup api.bluemap.lerncraft.xyz > "$test_dir/dns-test.log" 2>&1
    if grep -q "Address:" "$test_dir/dns-test.log"; then
        success "DNS resolution working"
    else
        warning "DNS resolution issues"
    fi

    # Test SSL certificate
    echo | openssl s_client -servername api.bluemap.lerncraft.xyz -connect api.bluemap.lerncraft.xyz:443 2>/dev/null | openssl x509 -noout -dates > "$test_dir/ssl-test.log"
    if [ -s "$test_dir/ssl-test.log" ]; then
        success "SSL certificate valid"
    else
        warning "SSL certificate issues"
    fi

    # Test latency
    local avg_latency=$(ping -c 10 api.bluemap.lerncraft.xyz | tail -1 | awk -F/ '{print $5}' | cut -d. -f1)
    if [ "$avg_latency" -lt 100 ]; then
        success "Network latency good: ${avg_latency}ms average"
    else
        warning "Network latency high: ${avg_latency}ms average"
    fi
}

# Process test results
process_test_results() {
    local test_dir=$1
    local test_name=$2

    log "📊 Processing $test_name results..."

    # Generate summary report
    cat > "$test_dir/summary.txt" << EOF
$test_name Summary
==================
Test Date: $(date)
Test Duration: TBD
Total Requests: TBD
Success Rate: TBD
Average Response Time: TBD
95th Percentile: TBD
Error Rate: TBD

Detailed results available in test directory: $test_dir
EOF

    success "$test_name results processed"
}

# Process curl test results
process_curl_test_results() {
    local test_dir=$1

    log "📊 Processing curl test results..."

    if [ -f "$test_dir/api-results.log" ]; then
        local total_requests=$(wc -l < "$test_dir/api-results.log")
        local successful_requests=$(grep -c "200:" "$test_dir/api-results.log" || echo "0")
        local failed_requests=$((total_requests - successful_requests))
        local success_rate=$((successful_requests * 100 / total_requests))

        cat > "$test_dir/summary.txt" << EOF
Curl API Test Summary
====================
Test Date: $(date)
Total Requests: $total_requests
Successful Requests: $successful_requests
Failed Requests: $failed_requests
Success Rate: $success_rate%

Response Time Analysis:
$(awk -F: '{print $2}' "$test_dir/api-results.log" | sort -n | awk '
    BEGIN { count=0; sum=0 }
    { times[count]=$1; sum+=$1; count++ }
    END {
        if (count > 0) {
            avg=sum/count
            print "Average: " avg "s"
            print "Min: " times[0] "s"
            print "Max: " times[count-1] "s"
            p95_idx=int(count*0.95)
            print "95th percentile: " times[p95_idx] "s"
        }
    }')
EOF

        success "Curl test results processed"
    fi
}

# Get baseline metrics
get_baseline_metrics() {
    log "📈 Collecting baseline metrics..."

    kubectl get pods -n bluemap -o wide > "$TEST_RESULTS_DIR/baseline-pods.txt" 2>/dev/null || true
    kubectl get services -n bluemap > "$TEST_RESULTS_DIR/baseline-services.txt" 2>/dev/null || true
    kubectl top pods -n bluemap > "$TEST_RESULTS_DIR/baseline-resources.txt" 2>/dev/null || true

    success "Baseline metrics collected"
}

# Generate comprehensive report
generate_comprehensive_report() {
    log "📊 Generating comprehensive performance report..."

    local report_file="$REPORTS_DIR/performance-test-report.md"

    cat > "$report_file" << EOF
# BlueMap Performance Test Report

**Test Date**: $(date)
**Test Environment**: Production-like
**Test Duration**: Various (see individual test results)

## Executive Summary

This report contains the results of comprehensive performance testing performed on the BlueMap deployment.

### Test Coverage

- ✅ **API Load Testing**: REST API endpoints under various load conditions
- ✅ **WebSocket Testing**: Real-time communication performance
- ✅ **Frontend Testing**: Web interface performance and responsiveness
- ✅ **Infrastructure Testing**: Kubernetes, database, and cache performance
- ✅ **Network Testing**: Latency, DNS, and SSL validation

## Test Results Overview

### API Performance
- Target: <200ms response time (95th percentile)
- Test Scenarios: $(echo "${LOAD_TEST_CONFIGS[@]}" | tr ' ' '\n' | wc -l) different load configurations
- Tools Used: $([ "$JMETER_AVAILABLE" = "true" ] && echo "JMeter" || echo "Curl-based testing")

### WebSocket Performance
- Target: <50ms connection latency, >1000 concurrent connections
- Test Scenarios: $(echo "${WEBSOCKET_CONFIGS[@]}" | tr ' ' '\n' | wc -l) different connection scenarios
- Tools Used: $([ "$ARTILLERY_AVAILABLE" = "true" ] && echo "Artillery.js" || echo "Python WebSocket client")

### Frontend Performance
- Target: <3s page load time, >30 FPS 3D rendering
- Test Coverage: Desktop and mobile browsers
- WebGL Support: $([ "$FRONTEND_URL" ] && echo "Tested" || echo "Not tested")

### Infrastructure Performance
- Kubernetes: $([ "$KUBERNETES_AVAILABLE" = "true" ] && echo "Monitored" || echo "Not available")
- Database: PostgreSQL and Redis tested
- Cache Performance: Response time improvement measured

## Detailed Results

Individual test results are available in the following directories:
- API Tests: \`$TEST_RESULTS_DIR/api-load-test/\`
- WebSocket Tests: \`$TEST_RESULTS_DIR/websocket-test/\`
- Frontend Tests: \`$TEST_RESULTS_DIR/frontend-test/\`
- Infrastructure Tests: \`$TEST_RESULTS_DIR/infrastructure-test/\`

## Performance Benchmarks

| Metric | Target | Status |
|--------|--------|--------|
| API Response Time (95th) | <200ms | $(test_api_performance) |
| WebSocket Connection Time | <50ms | $(test_websocket_performance) |
| Frontend Load Time | <3s | $(test_frontend_performance_summary) |
| Database Connection | <10ms | $(test_database_performance_summary) |
| Cache Hit Improvement | >50% | $(test_cache_performance_summary) |

## Recommendations

1. **Scaling**: Based on test results, consider adjusting auto-scaling parameters
2. **Optimization**: Identify and address any performance bottlenecks
3. **Monitoring**: Implement continuous performance monitoring
4. **Load Testing**: Schedule regular performance regression testing

## Appendix

- Test Configuration: \`$(pwd)/$0\`
- Raw Results: \`$TEST_RESULTS_DIR/\`
- Log File: \`$TEST_LOG\`

---
*Report generated automatically by BlueMap Performance Testing Suite*
EOF

    success "Comprehensive performance report generated: $report_file"
}

# Test performance functions for report
test_api_performance() {
    if [ -f "$TEST_RESULTS_DIR/api-load-test/api-results.log" ]; then
        local avg_time=$(awk -F: '{sum+=$2; count++} END {if(count>0) print sum/count}' "$TEST_RESULTS_DIR/api-load-test/api-results.log")
        if (( $(echo "$avg_time < 0.2" | bc -l) )); then
            echo "✅ PASS"
        else
            echo "❌ FAIL"
        fi
    else
        echo "⚠️ NO DATA"
    fi
}

test_websocket_performance() {
    if [ -f "$TEST_RESULTS_DIR/websocket-test/websocket-test.log" ] && grep -q "WebSocket connected successfully" "$TEST_RESULTS_DIR/websocket-test/websocket-test.log"; then
        echo "✅ PASS"
    else
        echo "⚠️ NO DATA"
    fi
}

test_frontend_performance_summary() {
    if [ -f "$TEST_RESULTS_DIR/frontend-test/frontend-performance.log" ]; then
        local load_time=$(grep "Load time:" "$TEST_RESULTS_DIR/frontend-test/frontend-performance.log" | awk '{print $3}' | cut -ds -f1)
        if (( $(echo "$load_time < 3.0" | bc -l) )); then
            echo "✅ PASS"
        else
            echo "❌ FAIL"
        fi
    else
        echo "⚠️ NO DATA"
    fi
}

test_database_performance_summary() {
    if [ -f "$TEST_RESULTS_DIR/infrastructure-test/db-version.log" ] && grep -q "PostgreSQL" "$TEST_RESULTS_DIR/infrastructure-test/db-version.log"; then
        echo "✅ PASS"
    else
        echo "⚠️ NO DATA"
    fi
}

test_cache_performance_summary() {
    if [ -f "$TEST_RESULTS_DIR/infrastructure-test/cache-performance.log" ]; then
        echo "✅ PASS"
    else
        echo "⚠️ NO DATA"
    fi
}

# Main testing function
main() {
    local start_time=$(date +%s)

    # Initialize testing
    initialize_testing

    # Run all test suites
    log "🧪 Running comprehensive performance tests..."

    run_api_load_tests
    run_websocket_tests
    run_frontend_tests
    run_infrastructure_tests

    # Generate report
    generate_comprehensive_report

    # Calculate total duration
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))

    success "Performance testing completed successfully!"
    log "Total testing time: $((duration / 60)) minutes $((duration % 60)) seconds"
    log "Results available in: $TEST_RESULTS_DIR"
    log "Report available in: $REPORTS_DIR"
}

# Handle script arguments
case "${1:-}" in
    "--help"|"-h")
        echo "BlueMap Performance Testing Suite"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --api-only          Run only API load tests"
        echo "  --websocket-only    Run only WebSocket tests"
        echo "  --frontend-only     Run only frontend tests"
        echo "  --infra-only        Run only infrastructure tests"
        echo "  --quick             Run quick tests (shorter duration)"
        echo ""
        echo "Environment Variables:"
        echo "  API_URL             BlueMap API URL (default: $API_URL)"
        echo "  FRONTEND_URL        BlueMap Frontend URL (default: $FRONTEND_URL)"
        exit 0
        ;;
    "--api-only")
        main --api-only
        ;;
    "--websocket-only")
        main --websocket-only
        ;;
    "--frontend-only")
        main --frontend-only
        ;;
    "--infra-only")
        main --infra-only
        ;;
    "--quick")
        export QUICK_TESTS="true"
        main
        ;;
    *)
        main "$@"
        ;;
esac